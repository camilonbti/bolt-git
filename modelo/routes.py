import json
import app.controller.common_controller as controller 
from app.controller import controllerAcessoTela
from app.controller import controllerManager
from app.controller import controllerEcommerce

def makeRoutes(app):

    print("Gerando rotas...")
    makeCustomRoutes(app)

    makeRoutesByFileRoutes(app)
    makeRoutesByFileDic(app)

def makeCustomRoutes(app):
    app.add_url_rule("/api/config/dicionario", view_func=controller.getDicionario, methods=['GET'])
    
    app.add_url_rule("/api/system/TableWithChildren/<param_list>", view_func=controller.getTableWithChildren, methods=['GET'])
    app.add_url_rule("/api/system/TableWithChildren/", view_func=controller.updateTableWithChildren, methods=['POST'])
    
    app.add_url_rule("/api/ACESSO/ACESSO_TELA", view_func=controllerAcessoTela.getAcessoTela, methods=['GET'])

    app.add_url_rule("/api/ACESSO/USUARIOGRUPO/TableWithChildren/<param_list>", view_func=controllerAcessoTela.getTableWithChildrenForAcessoTelaController, methods=['GET'])
    app.add_url_rule("/api/ACESSO/USUARIOGRUPO/TableWithChildren/", view_func=controllerAcessoTela.updateTableWithChildrenForAcessoTelaController, methods=['POST'])
    app.add_url_rule("/api/ACESSO/USUARIOGRUPO/USUARIOGRUPO_X_PERMISSAO/<guid_grupo>", view_func=controllerAcessoTela.getPermissaoUsuarioGrupo, methods=['GET'])
    app.add_url_rule("/api/ACESSO/USUARIOGRUPO/LIST_ACESSO/<id_usuario>", view_func=controllerAcessoTela.getListaAcessoDoUsuario, methods=['GET'])
    
    app.add_url_rule("/api/DEPLOY/MANAGER_DEPLOY/WITH_DETAIL/<guid_app>", view_func=controllerManager.get_deploy_with_details, methods=['GET'])
    app.add_url_rule("/api/DEPLOY/MANAGER_DEPLOY/LAST_VERSION/<guid_app>", view_func=controllerManager.get_last_version, methods=['GET'])
    
    app.add_url_rule("/api/MANAGER/OLD_VERSION/<old_version>/CURRENT_VERSION/<current_version>/SCRIPTS/<guid_app>", view_func=controllerManager.get_scripts_version, methods=['GET'])
    app.add_url_rule("/api/MANAGER/CURRENT_VERSION/<current_version>/SCRIPTS/<guid_app>", view_func=controllerManager.get_all_scripts_for_version, methods=['GET'])    

    app.add_url_rule("/api/ECOMMERCE/ACESSO", view_func=controllerEcommerce.getAcesso, methods=['GET'])

def makeRoutesByFileRoutes(app):
    pass

def makeRoutesByFileDic(app):
    file = open("./config/nbSystem.dic", "r", encoding='utf-8-sig')
    try:
        dic = json.loads(file.read())
        for table in dic["tabelas"]:
            route = f"/api/{table['resource'].upper()}/{table['nome'].upper()}"

            app.add_url_rule(route, view_func=controller.restGet, methods=['GET'])
            app.add_url_rule(route, view_func=controller.updateTable, methods=['POST'])
            app.add_url_rule(route, view_func=controller.updateTable, methods=['PUT'])
            app.add_url_rule(f'{route}/<guid>', view_func=controller.restDelete, methods=['DELETE'])

            print(f"\t{route}")

    finally:
        file.close()


