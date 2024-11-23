import json

class DicTable():
    def __init__(self):
        self._tables = {}
        self.__load__()
        print("Carregado dicionario...")

    @property
    def tables(self):
        return self._tables

    def __load__(self):
        file = open("./config/nbSystem.dic", "r", encoding='utf-8-sig')
        try:
            dic = self.keysToUpperCase(json.loads(file.read()))
            for tabela in dic["tabelas"]:
                primary_key = tabela.get("primaryKey")
                if (len(tabela["fieldsView"]) == 0):
                    tabela["fieldsView"] = ''

                if not(primary_key):
                    tabela["primaryKey"] = f"GUID{tabela['nome']}"
                elif len(primary_key.split(',')) > 1:
                    tabela["primaryKey"] = primary_key.split(',')[0].strip()
                    tabela["gen_id"    ] = primary_key.split(',')[1].strip()

                self._tables[tabela['nome']] = tabela

        finally:
            file.close()

    def keysToUpperCase(self, obj):
        fields_no_captalize = ["caption", "hint", "displayValue", "fieldDisplay"]
        types_no_captalize = ["int", "bool"]
        output = {}
        for key in obj:
            item = obj[key]
            if (item.__class__.__name__ == 'list'):
                value = self.arrayToUpperCase(item)
            elif (item.__class__.__name__ == 'dict'):
                value = self.keysToUpperCase(item)
            elif (item.__class__.__name__ in types_no_captalize):
                value = item
            elif not(key in fields_no_captalize):
                value = item.upper()
            else:
                value = item

            output[key] = value

        return output

    def arrayToUpperCase(self, array):
        output = []
        for item in array:
            output.append(self.keysToUpperCase(item))

        return output

    def to_json(self):
        return json.dumps(self._tables)

dic_table = DicTable()
