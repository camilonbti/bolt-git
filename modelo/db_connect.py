import fdb
import os 

def getConnection():
    return fdb.connect(
        dsn      = os.environ.get('nbti.nbAdminSystem.database-database'),
        user     = os.environ.get('nbti.nbAdminSystem.database-username'), 
        password = os.environ.get('nbti.nbAdminSystem.database-password')
    )