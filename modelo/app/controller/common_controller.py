import db_connect 
import json
from flask import Flask, request
from dbquery import Query
from enum import Enum
from app.lib.nbquery import NBQuery, getSetId
from app.lib.dic_table import dic_table
from app.lib.serializer import toJson
import uuid 

class TYPE_PARSER(Enum):
    DATA   = 'DATA'  
    JSON   = 'JSON'  

def restGet():
    return CommonControl().get()

def updateTable():
    return CommonControl().updateTable()

def updateTableWithChildren():
    return CommonControl().updateTableWithChildren()

def getTableWithChildren(param_list):
    return CommonControl().getTableWithChildren(param_list)

def restDelete(guid):
    return CommonControl().delete(guid)

def getDicionario():
    return dic_table.to_json()
    
class CommonControl():

    def __init__(self):
        self.db_connect  = db_connect.getConnection()
        self.type_parser = TYPE_PARSER.JSON
        self.params      = dict(request.args) or {}

    def get_table_name(self):
        return request.path.replace("/api/","").split("/")[1]

    def get(self):
        table = self.get_table_name()

        resp = self.executeQuery(table, self.params)
        return self.parser(resp.rows) 
    
    def getTableWithChildren(self, list):
        result = {}
        for resource in list.split(","):
            table = resource.split(".")[1]
            if '|' in table:
                nome_tabela = resource.split("|")[0]
                if (result.get(nome_tabela)):
                    result[resource] = result[nome_tabela]
                    continue
            
            tableDic     = dic_table.tables[table]
            tableOrderBy = tableDic['orderBy']
 
            qry = self.executeQuery(table, self.params, tableOrderBy)
            result[resource] = qry.rows

        return self.parser(result)

    def updateTable(self): 
        tabela = self.get_table_name()
        data  = request.get_json()

        array_itens = data
        if not(isinstance(data, list)):
            array_itens = [data]
        
        try:
            for json in array_itens:
                self.execInsertOrUpdate(tabela, json)
            
            self.db_connect.commit()

            return "update--->"

        except Exception as e:
          self.db_connect.rollback()
          raise Exception(e)
        
    def updateTableWithChildren(self):
        itens = request.get_json()

        try:
            result, id_master = self.execUpdateTableWithChildren(itens)

            return result
        except Exception as e:        
            response = {
                "code"       : 500,
                "error"      : str(e)
            }
            return json.dumps(response)

    def execUpdateTableWithChildren(self, itens, commit = True):
        try:
            key_tbl_mst  = list(itens)[0]
            id_master, pk_master = getSetId(key_tbl_mst, itens[key_tbl_mst][0])
            for item in itens:
                tabela    = item.split(".")[1]
                operacoes = itens[item]

                for jsonOp in operacoes:
                    action = jsonOp.get("lookup_action", 'edit')

                    if action.lower() in ['insert', 'edit']:
                        jsonOp[pk_master] = id_master

                        self.execInsertOrUpdate(tabela, jsonOp)
                    elif action.lower() == 'delete':
                        newParams = self.params

                        if(newParams == {}):
                            primaryKey = dic_table.tables[tabela]["primaryKey"]
                            newParams  = { primaryKey : jsonOp.get(primaryKey, '0') }

                        self.execDelete(tabela, newParams, False)

            if(commit):
                self.db_connect.commit()

            response = {}
            response[pk_master] = id_master

            return json.dumps(response), id_master

        except Exception as e:
          self.db_connect.rollback()
          raise Exception(e)

    def executeQuery(self, table, params, orderBy = None):
        qry = NBQuery(self.db_connect)
        qry.table  = table
        qry.params = params
        qry.orderBy = orderBy
        qry.open()

        return qry

    def execInsertOrUpdate(self, table, json):
        qry = NBQuery(self.db_connect)
        qry.table  = table
        qry.execInsertOrUpdate(json)

    def execDelete(self, table, params, commit = True):
        qry = NBQuery(self.db_connect)
        qry.table  = table
        qry.params = params
        qry.execDelete()

        if('childrenTables' in dic_table.tables[table]):
            for item in dic_table.tables[table]["childrenTables"]:
                self.execDelete(item['tableName'], params)

        if(commit):
            self.db_connect.commit()

    def delete(self, guid):
        table  = self.get_table_name()
        primaryKey = dic_table.tables[table]["primaryKey"]
        condicao  = { primaryKey : guid}

        self.execDelete(table, condicao)

        return "deleted"

    def parser(self, data):
        if (self.type_parser == TYPE_PARSER.DATA):
            return data

        if (self.type_parser == TYPE_PARSER.JSON):
            return toJson(data)

        return data