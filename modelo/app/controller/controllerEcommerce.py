import db_connect 
import json
import uuid
from flask import Flask, request
from app.controller.common_controller import CommonControl 
from dbquery import Query
from app.lib.nbquery import NBQuery, getSetId
from app.lib.dic_table import dic_table
from app.lib.serializer import toJson

def getAcesso():
    return EcommerceControl().getAcesso()

class EcommerceControl(CommonControl):

    def getAcesso(self):
        paramURL = None

        for param in self.params:
            value = self.params[param]

            if('URL' in param.upper()):
                paramURL = value

        if(not paramURL):
            raise Exception('{"error": "É necessário informar a url!"}')

        qry = Query(self.db_connect)
        qry.sql.add("select ID_LOJA as TOKEN from ecommerce_acesso          ")
        qry.sql.add("where '"+str(paramURL)+"' like url||'%' ")

        qry.open()

        return qry.toJson()

