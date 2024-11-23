import db_connect 
import json
import uuid
from enum import Enum
from dbquery import Query
from flask import Flask, request
from stringlist import StringList
from app.lib.dic_table import dic_table
from app.lib.serializer import formatDate, formatDateTime

class SQlOperator(Enum):
    AND        = 'AND'
    LIMIT      = 'LIMIT'
    LAST_PAGE  = 'LAST' 
    ORDER_BY   = 'ORDERBY' 
    BETWEEN    = 'BETWEEN' 
    LIKE       = 'LIKE' 
    DIFFERENT  = '<>'
    DATE       = 'DATE'
    ACESSOLOJA = 'ACESSOLOJAREGIONAL'

class NBQuery(Query):

    def __init__(self, conn=None):
        super().__init__(conn)

        self._table     = ""
        self._params    = None
        self._alias     = ""
        self._metadata  = None
        self.primaryKey = "" 
        self._fields    = None
        self._limit     = 0
        self._pagina    = 0
        self._join      = StringList()
        self.orderBy    = None

    @property
    def metadata(self):
        return  self._metadata

    @property
    def alias(self):
        return  self._table

    @property
    def table(self):
        if 'VIEW_' in self._table.upper():
            return self._table.Split('_')[2]

        return self._table
    
    @property
    def full_name(self):
        return self.metadata["resource"] + '.' + self.metadata["nome"]

    @table.setter
    def table(self, value):
        self._table     = value.split("|")[0]
        self._metadata  = dic_table.tables[value]

        pk = self.metadata["primaryKey"].upper().split(' AS ')
        self.primaryKey      = pk[0]
        self.primaryKeyAlias = pk[len(pk)-1]
        
        self.lst_fields = []
        for item in self._metadata["campos"]:
            lst = item["nome"].upper().split(' AS ')
            self.lst_fields.append(lst[len(lst)-1])

    def getMetadataField(self, fieldName):
        for item in self._metadata["campos"]:
            if item["nome"].upper() == fieldName.upper():
                return item
            
        return None

    @property
    def limit(self):
        return self._limit

    @limit.setter
    def limit(self, value):
        self._limit = int(value)

    @property
    def pagina(self):
        return self._pagina

    @pagina.setter
    def pagina(self, value):
        self._pagina =  int(value)

    @property
    def params(self):
        return self._params

    @params.setter
    def params(self, value):
        self._params = value

    def get_field_or_alias(self, field):
        if not(self._metadata):
            return field

        lst_fields = [ item["nome"].upper() for item in self._metadata["campos"]]
        for item in lst_fields:
            lst = item.split(' AS ')
            if lst[len(lst)-1] == field:
                return lst[0]
        
        return field

    def open(self, pbMontarInstrucao=True):

        if pbMontarInstrucao:
            self.montarInstrucaoConsulta()

        self.setLimit()

        super().open()

    def montarInstrucaoConsulta(self):
        self.sql.clear()
        self.sql.add('Select '                          )
        self.sql.add(self.retornarProjecao()            )
        self.sql.add(f"From {self.table} AS {self.alias}")
        self.addJoins()
        self.addCondition()
    
    def retornarProjecao(self):
        sql_projection = self.table + '.*'

        metadata = self.metadata
        if not(metadata):
            return sql_projection

        for field in metadata["campos"]:
            oRelacionamento = field["relacionamento"]
            if (oRelacionamento):
                sField      = 'LOOKUP_'  + field["nome"]
                sFieldPai   = sField     + '.' + oRelacionamento["campoPai"]
                sFieldFilho = self.table + '.' + field["nome"]

                sql_projection +=  f' , {sField}.{oRelacionamento["displayCaption"]} AS {sField} '

                self._join.add(f'LEFT JOIN {oRelacionamento["tabelaPai"]} AS {sField} ON ({sFieldPai}={sFieldFilho})')

        return sql_projection

    def setLimit(self):
        if (self.limit == 0):
            return
        
        skip_value = 0 if self.pagina == 0 else self.limit * self.pagina
        sqlLimit = f'\n  FIRST {self.limit} SKIP {skip_value} \n'
        
        sql_parts = self.sql.text.upper().split('SELECT')
        sql_parts.remove("")
        sql_parts[0] = f"SELECT {sqlLimit} {sql_parts[0]}"

        self.sql.text = 'SELECT'.join(sql_parts)
    
    def addJoins(self):
        self.sql.add(self._join.text)

    def addCondition(self):
        self.sql.add("Where 1=1")
        
        for param in self._params or {}:
            operator = self.getAddOperation(param)

            switcher = {
                SQlOperator.AND       : self.addCondAnd,
                SQlOperator.LIMIT     : self.defineLimit,
                SQlOperator.LAST_PAGE : self.defineLastPage,
                SQlOperator.LIKE      : self.addCondLike,
                SQlOperator.ORDER_BY  : self.addCondOrderBy,
                SQlOperator.DIFFERENT : self.addCondDifferent,
				SQlOperator.DATE      : self.addCondDate,
				SQlOperator.BETWEEN   : self.addCondBetween,
                SQlOperator.ACESSOLOJA: self.addCondAcessoLoja,
            }

            switcher[operator](param)

        if (self.orderBy):
            self.sql.add("Order By " + self.orderBy)

    def getAddOperation(self, param):
        value = param.upper()
        if (value == SQlOperator.LIMIT.value):
            return SQlOperator.LIMIT
        elif (value == SQlOperator.LAST_PAGE.value):
            return SQlOperator.LAST_PAGE
        elif (SQlOperator.LIKE.value in value):
            return SQlOperator.LIKE
        elif (SQlOperator.ORDER_BY.value in value):
            return SQlOperator.ORDER_BY
        elif (SQlOperator.DIFFERENT.value in value):
            return SQlOperator.DIFFERENT
        elif (SQlOperator.DATE.value in value):
            return SQlOperator.DATE
        elif (SQlOperator.BETWEEN.value in value):
            return SQlOperator.BETWEEN
        elif (SQlOperator.ACESSOLOJA.value in value):
            return SQlOperator.ACESSOLOJA
        else:
            return SQlOperator.AND

    def addCondLike(self, param):
        params = param.split(SQlOperator.LIKE.value)
        param = params[0]
        value = params[1]
        typeValue = type(value)
        
        if(typeValue == str):
            value = value.upper()

        self.sql.add(f"and {self.getFieldParam(param)} LIKE '{value}%'")

    def addCondAnd(self, param):
        typeValue = type(self._params[param])
        
        if(typeValue == str):
            self._params[param] = self._params[param].upper()
            
        if(self._params[param] == 'NULL'):
            self.sql.add(f"and {self.getFieldParam(param)} IS NULL ")
        else:
            self.sql.add(f"and {self.getFieldParam(param)} = '{self._params[param]}'")   

    def addCondDate(self, param):
        params = param.split(SQlOperator.DATE.value)
        param  = params[0]
        value  = params[1]

        self.sql.add(f"and {self.getFieldParam(param)} = '{value}'")
    
    def addCondBetween(self, param):
        params  = param.split(SQlOperator.BETWEEN.value)
        param   = params[0]
        value   = params[1]
        dataIni = value.split(';')[0].replace('T', ' ')
        dataFim = value.split(';')[1].replace('T', ' ')
        
        self.sql.add(f"and {self.getFieldParam(param)} between '{dataIni}' and '{dataFim}' ")

    def addCondDifferent(self, param):
        params = param.split(SQlOperator.DIFFERENT.value)
        param = params[0]
        value = params[1]
        typeValue = type(value)

        if(typeValue == str):
            value = value.upper()

        if(value == 'NULL'):
            self.sql.add(f"and {self.getFieldParam(param)} IS NOT NULL ")
        else:
            self.sql.add(f"and COALESCE({self.getFieldParam(param)},'') <> '{value}'")    
    
    def addCondAcessoLoja(self, param):
        params = param.upper().split(SQlOperator.ACESSOLOJA.value)

        self.sql.add(getCondicaoAcessoLojas(params[2]))

    def defineLimit(self, param):
        self.limit = self._params[param]

    def defineLastPage(self, param):
        self.pagina = self._params[param]

    def addCondOrderBy(self, param):
        self.orderBy = self._params[param]

    def execInsertOrUpdate(self, json):
        value_pk = json.get(self.primaryKeyAlias)
        condicao  = f"WHERE  {self.primaryKey} = '{str(value_pk).upper()}' "

        if value_pk and self.existItem(condicao):
            self.execUpdate(json, condicao)
        else:
            self.execInsert(json)

    def execInsert(self, json): 
        if not(json.get(self.primaryKeyAlias)):
            getSetId(self.full_name, json)

        self.sql.clear()
        self.sql.add(f"Insert Into {self.table}(")
        
        fields = []
        for item in json :
            if self.__toAllowField(item):
                field = self.get_field_or_alias(item)
                fields.append(field)
        
        self.sql.add(",".join(fields))
        self.sql.add(")values(")

        values = [] 
        for item in json :
            if self.__toAllowField(item):
                values.append(self.__get_value_by_sql(item, json))
        
        self.sql.add(",".join(values))
        self.sql.add(")")

        self.execute()

    def execUpdate(self, json, condicao):
        self.sql.clear()
        self.sql.add(f"UPDATE {self.table} SET")
        
        fields = []
        for item in json:
            if self.__toAllowField(item):
                value = self.__get_value_by_sql(item, json)
                fields.append(f"{self.get_field_or_alias(item)}={value}")
        
        self.sql.add(",".join(fields))
        self.sql.add(condicao)

        self.execute()

    def execDelete(self):
        self.sql.clear()
        self.sql.add(f"Delete from {self.table}")
        self.addCondition()
        
        self.execute()

    def existItem(self, condicao):
        qry = Query(self.conn)
        qry.sql.add(f"Select 1 from {self.table} {condicao}")
        qry.open()
        
        return len(qry.rows) > 0

    def __get_value_by_sql(self, item, json):
        value = json[item]

        metadata_field = self.getMetadataField(item)
        field_type = metadata_field["tipo"] or ""

        if (field_type == "DATE"):
            value = formatDate(value)
        elif(field_type == "DATETIME"):
            value = formatDateTime(value)
        
        emptyNumber = ( (field_type == "INTEGER") or (field_type == "NUMERIC") ) and (value == 0)
        
        value = f"""'{str(value).replace("'", "''")}'""" if value or emptyNumber else "NULL"

        if not(metadata_field["ignoreCaseSensitive"]):
            value = value.upper()

        return value
        
    def __toAllowField(self, field):
        if (field.upper().find('LOOKUP_'))  == 0 or \
           not(field.upper() in self.lst_fields):
            return

        return True

    def getFieldParam(self, param):
        field = self.get_field_or_alias(param)
        if not(self.table):
            return field
            
        return field if '.' in field else f'{self.table}.{field}'

def getSetId(key, json):
    table_name   = key.split(".")[1].split("|")[0]
    metadata     = dic_table.tables[table_name]
    primary_key  = metadata["primaryKey"].upper()

    id = json.get(primary_key)
    if not(id):
        gen_id = metadata.get("gen_id")
        id = getGenId(gen_id) if gen_id else str(uuid.uuid4()).replace('-','').upper()
    
    json[primary_key] = id

    return id, primary_key

def getGenId(gen):
    qry = Query(db_connect.getConnection())
    qry.sql.add(F"SELECT GEN_ID({gen}, 1) AS ID FROM RDB$DATABASE")
    qry.open()

    return qry.rows[0]["ID"]

def getCondicaoAcessoLojas(field_loja):
    id_usuario = request.environ['HTTP_GUID_USUARIO']

    qry = NBQuery(db_connect.getConnection())
    qry.sql.text = f""" SELECT '''' || LIST(ID_LOJA, ''',''')  || ''''as LISTA_LOJAS FROM LOJA
                        WHERE ID_LOJA IN (
                            SELECT
                                ID_LOJA
                            FROM USUARIOS
                            WHERE ID_USUARIO = '{id_usuario}'

                            UNION

                            SELECT ID_LOJA FROM LOJA
                            WHERE ID_REGIAO IN  (
                                SELECT ID_REGIONAL
                                FROM USUARIOS_ACESSO_REGIONAL
                                WHERE ID_USUARIO = '{id_usuario}'
                            )

                            UNION

                            SELECT ID_LOJA FROM USUARIOS_ACESSO_LOJA
                            WHERE ID_USUARIO = '{id_usuario}'

                            UNION

                            SELECT ID_LOJA FROM LOJA
                            WHERE 'V' = (SELECT ACESSO_REGIONAL FROM USUARIOS WHERE ID_USUARIO = '{id_usuario}')
                            OR    'V' = (SELECT ACESSO_COMPLETO FROM USUARIOS WHERE ID_USUARIO = '{id_usuario}')
                        )
                    """
    qry.open(False)

    return f""" AND {field_loja} IN ({qry.rows[0]["LISTA_LOJAS"] or "'0'"})"""