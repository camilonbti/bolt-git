import db_connect 
import json
import uuid
from flask import Flask, request
from app.controller.common_controller import CommonControl 
from dbquery import Query
from app.lib.nbquery import NBQuery, getSetId
from app.lib.dic_table import dic_table
from app.lib.serializer import toJson

def getAcessoTela():
    return AcessoTelaControl().getAcessoTela()

def updateTableWithChildrenForAcessoTelaController():
    return AcessoTelaControl().updateTableWithChildren()

def getTableWithChildrenForAcessoTelaController(param_list):
    return AcessoTelaControl().getTableWithChildren(param_list)

def getPermissaoUsuarioGrupo(guid_grupo):
    return AcessoTelaControl().getPermissaoUsuarioGrupo(guid_grupo)

def getListaAcessoDoUsuario(id_usuario):
    return AcessoTelaControl().getListaAcessoDoUsuario(id_usuario)

class AcessoTelaControl(CommonControl):

    def getAcessoTela(self):
        table = self.get_table_name()

        rows = self.executeQuery(table, self.params).rows

        for item in rows:
            params = { "GUIDACESSO_TELA" : item["GUIDACESSO_TELA"] }
            item["ACESSOS"] = self.executeQuery("ACESSO_TELA_PERMISSAO", params).rows

        return toJson(rows)

    def getTableWithChildren(self, list):
        return super().getTableWithChildren(list)

    def updateTableWithChildren(self):
        itens = request.get_json()
        try:
            key_tbl_mst  = list(itens)[0]
            id_grupo, pk_master = getSetId(key_tbl_mst, itens[key_tbl_mst][0])

            for item in itens:
                tabela = item.split(".")[1]
                operacoes = itens[item]

                if (tabela.upper() == "USUARIOGRUPO_X_PERMISSAO"):
                    for permissao in operacoes:
                        if not(permissao):
                            continue

                        for key in list(permissao):
                            if 'lookup_'                in key.lower() or \
                            'guidusuariogrupo'          in key.lower() or \
                            'guidacesso_tela_permissao' in key.lower() or \
                            'guidacesso_tela'           in key.lower() or \
                            'guidusuariogrupo_permissao'in key.lower() or \
                            'valor'                     in key.lower():
                                continue
                            
                            json = {
                                "GUIDUSUARIOGRUPO_PERMISSAO" : f'{id_grupo}+{key}',
                                "GUIDACESSO_TELA_PERMISSAO"  : key,
                                "GUIDUSUARIOGRUPO"           : id_grupo,
                                "VALOR"                      : permissao[key]
                            }

                            self.execInsertOrUpdate(tabela, json)

                    continue

                for json in operacoes:
                    action = json.get("lookup_action", 'edit')
                    if action.lower() in ['insert', 'edit']:
                        json[pk_master] = id_grupo
                        self.execInsertOrUpdate(tabela, json)
                    elif action.lower() == 'delete':
                        self.execDelete(tabela, self.params)

            self.db_connect.commit()
            return "update--->"

        except Exception as e:
          self.db_connect.rollback()
          raise Exception(e)

    def getPermissaoUsuarioGrupo(self, guid_grupo):
        qry = Query(self.db_connect)
        qry.sql.add("SELECT                                                                                             ")
        qry.sql.add("  T.GUIDACESSO_TELA,                                                                               ")
        qry.sql.add("  '{\"' || LIST (PU.GUIDACESSO_TELA_PERMISSAO || '\": \"' || PU.VALOR, '\",\"')  || '\"}' PERMISSAO")
        qry.sql.add("FROM USUARIOGRUPO_X_PERMISSAO PU                                                                   ")
        qry.sql.add("LEFT JOIN ACESSO_TELA_PERMISSAO  P ON (P.GUIDACESSO_TELA_PERMISSAO  = PU.GUIDACESSO_TELA_PERMISSAO)")
        qry.sql.add("LEFT JOIN ACESSO_TELA            T ON (T.GUIDACESSO_TELA            = P.GUIDACESSO_TELA           )")
        qry.sql.add(F"WHERE GUIDUSUARIOGRUPO = '{guid_grupo}'                                                           ")
        qry.sql.add("GROUP BY T.GUIDACESSO_TELA                                                                         ")

        qry.open()

        return qry.toJson()

    def getListaAcessoDoUsuario(self, id_usuario):
        qry = Query(self.db_connect)
        qry.sql.add("SELECT                                                                                             ")
        qry.sql.add("   T.GUIDACESSO_TELA ,                                                                             ")
        qry.sql.add("   T.NOME            ,                                                                             ") 
        qry.sql.add("   '{\"' || LIST(P.NOME || '\":\"' || UP.VALOR, '\",\"' )|| '\"}' AS PERMISSAO                     ")
        qry.sql.add("FROM USUARIO_X_GRUPO  AS UG                                                                        ")
        qry.sql.add("JOIN USUARIOS                 AS U  ON (U.ID_USUARIO                = UG.ID_USUARIO               )")
        qry.sql.add("JOIN USUARIOGRUPO_X_PERMISSAO AS UP ON (UP.GUIDUSUARIOGRUPO         = UG.GUIDUSUARIOGRUPO         )")
        qry.sql.add("JOIN ACESSO_TELA_PERMISSAO    AS P  ON (P.GUIDACESSO_TELA_PERMISSAO = UP.GUIDACESSO_TELA_PERMISSAO)")
        qry.sql.add("JOIN ACESSO_TELA              AS T  ON (T.GUIDACESSO_TELA           = P.GUIDACESSO_TELA           )")
        qry.sql.add(f"WHERE U.ID_USUARIO = '{id_usuario}'                                                               ")
        qry.sql.add("GROUP BY T.GUIDACESSO_TELA, T.NOME                                                                 ")
        qry.open()

        return qry.toJson()