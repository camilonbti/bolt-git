import db_connect 
import json
import uuid
from flask import Flask, request
from app.controller.common_controller import CommonControl 
from dbquery import Query
from app.lib.nbquery import NBQuery, getSetId
from app.lib.dic_table import dic_table
from app.lib.serializer import toJson

def get_all_scripts_for_version(current_version, guid_app):
    return ManagerControl().get_all_scripts_for_version(current_version, guid_app)

def get_scripts_version(old_version, current_version, guid_app):
    return ManagerControl().get_scripts_version(old_version, current_version, guid_app)

def get_deploy_with_details(guid_app):
    return ManagerControl().get_deploy_with_details(guid_app)
    
def get_last_version(guid_app):
    return ManagerControl().get_last_version(guid_app)

class ManagerControl(CommonControl):

    def get_all_scripts_for_version(self, current_version, guid_app):
        qry = Query(self.db_connect)
        qry.sql.text = self.getSqlScript('GER', current_version, guid_app)
        qry.open()

        scripts = json.loads( qry.toJson() )

        qry = Query(self.db_connect)
        qry.sql.text = self.getSqlScript('FIS', current_version, guid_app)
        qry.open()

        scriptsFiscal = json.loads( qry.toJson() )

        qry = Query(self.db_connect)
        qry.sql.text = self.getSqlScript('XML', current_version, guid_app)
        qry.open()

        scriptsXML = json.loads( qry.toJson() )

        data = {
            "MANAGER_SCRIPTS"        : scripts,
            "MANAGER_SCRIPTS_FISCAL" : scriptsFiscal,
            "MANAGER_SCRIPTS_XML"    : scriptsXML
        }

        return json.dumps(data)
    
    def getSqlScript(self, tipo, current_version, guid_app):
        switchTable  = {
            'GER' : 'MANAGER_SCRIPTS',
            'FIS' : 'MANAGER_SCRIPTS_FISCAL',
            'XML' : 'MANAGER_SCRIPTS_XML',
        }

        switchField  = {
            'GER' : 'IDLASTSCRIPT',
            'FIS' : 'IDLASTSCRIPT_FISCAL',
            'XML' : 'IDLASTSCRIPT_XML',
        }

        tableName = switchTable[tipo]
        fieldName = switchField[tipo]

        return f"""
            SELECT * FROM {tableName}
            WHERE GUIDAPP   = '{guid_app}'
            AND   IDSCRIPT <= (
                                SELECT {fieldName} FROM MANAGER_VERSION
                                WHERE VERSION = '{current_version}'
                                AND   GUIDAPP = '{guid_app}'
                              )
            ORDER BY IDSCRIPT
        """

    def get_scripts_version(self, old_version, current_version, guid_app):
        qry = Query(self.db_connect)
        qry.sql.text = f"""
            SELECT *                         
            FROM MANAGER_SCRIPTS             
            WHERE IDSCRIPT >                 
            (                             
                SELECT                       
                MIN(IDLASTSCRIPT)         
                FROM MANAGER_VERSION         
                WHERE IDSCRIPT >
                (
                    SELECT
                    MIN(IDLASTSCRIPT)
                    FROM MANAGER_VERSION
                    WHERE IDVERSION >= (
                                        SELECT IDVERSION
                                        FROM MANAGER_VERSION
                                        WHERE VERSION = '{old_version}'
                                        AND   GUIDAPP = '{guid_app}'
                                        )
                )
                AND IDSCRIPT <=
                (
                    SELECT
                    IDLASTSCRIPT
                    FROM MANAGER_VERSION
                    WHERE IDVERSION = (
                                        SELECT IDVERSION
                                        FROM MANAGER_VERSION
                                        WHERE VERSION = '{current_version}'
                                        AND   GUIDAPP = '{guid_app}'
                                        )
                )
            )
            AND GUIDAPP = '{guid_app}'
            ORDER BY IDSCRIPT
        """

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
        qry.sql.add(f"WHERE U.ID_USUARIO = {id_usuario}                                                                 ")
        qry.sql.add("GROUP BY T.GUIDACESSO_TELA, T.NOME                                                                 ")
        qry.open()

        return qry.toJson()

    def get_deploy_with_details(self, guid_app):
        qry = Query(self.db_connect)
        qry.sql.text = f"""
            SELECT
                FIRST 50 SKIP 0
                DEPLOY.GUID_MANAGER_DEPLOY,
                DEPLOY.STATUS,
                DEPLOY.VERSION,
                SERVIDOR.NOME AS SERVIDOR,
                DEPLOY.DATA_HORA,
                '[' || LIST( '{{"STEP" : "' || DETAIL.STEP || '", "PASSED" : "' || DETAIL.PASSED || '"}}', ',' ) || ']' AS STEPS

            FROM MANAGER_DEPLOY AS DEPLOY
            LEFT JOIN SERVIDOR AS SERVIDOR ON (SERVIDOR.GUID_SERVIDOR = DEPLOY.GUID_SERVIDOR)
            LEFT JOIN MANAGER_DEPLOY_DETAIL AS DETAIL ON (DETAIL.GUID_MANAGER_DEPLOY = DEPLOY.GUID_MANAGER_DEPLOY)
            WHERE GUIDAPP = '{guid_app}'
            GROUP BY 1,2,3,4,5
            ORDER BY DATA_HORA DESC
        """
        qry.open()

        return qry.toJson()

    def get_last_version(self, guid_app):
        qry = Query(self.db_connect)
        qry.sql.text = f"""
            SELECT
                *
            FROM MANAGER_VERSION
            WHERE GUIDAPP = '{guid_app}'
            AND IDVERSION = (
                SELECT MAX(IDVERSION) AS IDVERSION
                FROM MANAGER_VERSION
                WHERE GUIDAPP = '{guid_app}'
            )
        """
        qry.open()

        return qry.toJson()
    
