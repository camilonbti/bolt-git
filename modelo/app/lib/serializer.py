import json
import datetime
from decimal import Decimal
from flask import request


def dtSerializer(obj):
    if isinstance(obj, float) or isinstance(obj, Decimal):
        return getStandardNumeric(obj)
    if obj.__class__ == datetime.date:
        return getStandardDate(obj)
    if obj.__class__ == datetime.datetime:
        return getStandardDateTime(obj)
    if obj.__class__ == datetime.time:
        return getStandardTime(obj)
    else:
        TypeError("Unknown serializer")


def getStandardNumeric(value):
    return str(value)

def getStandardDate(date):
    return f'{ str(date.day).rjust(2,"0")}/{ str(date.month).rjust(2,"0")}/{ str(date.year).rjust(2,"0")}'

def getStandardDateTime(datetime):
    date = getStandardDate(datetime)
    time = f'{ str(datetime.hour).rjust(2,"0")}:{str(datetime.minute).rjust(2,"0")}:{str(datetime.second).rjust(2,"0")}' 
    return f'{date} {time}'

def getStandardTime(time):
    return f'{time}'

def toJson(object):
    return json.dumps(object, default=dtSerializer)

def formatDate(value):
    if not(value):
        return value

    # print('***')
    # print(value)
    # print(value.find('-'))

    if(value.find('T')):
        value = value.split('T')[0]

    if(value.find('-') == -1):
        date = value.split('/')
        # print(date)
        # print(f'{date[1]}/{date[0]}/{date[2]}')
        return f'{date[1]}/{date[0]}/{date[2]}'
    else:
        # date = value.split('-')
        date = value
        # print(date)
        # print(f'{date[2]}/{date[1]}/{date[0]}')
        # return f'{date[2]}.{date[1]}.{date[0]}'
        return date

    # return f'{date[1]}/{date[0]}/{date[2]}'

def formatDateTime(value):
    if not(value):
        return value
    
    isUtcFormat = value.find("Z") > 0
    if isUtcFormat :
        value = value.replace("Z", "")

    try:
        date  = datetime.datetime.fromisoformat(value)
        hours = date.hour if not(isUtcFormat) else  date.hour -3
        value = f"{date.day}/{date.month}/{date.year} {hours}:{date.minute}:{date.second}"
    except:
        pass
    
    array_date = value.split(" ")
    date  = array_date[0]
    time  = array_date[1]  if len(array_date) > 1 else "00:00:00"

    return formatDate(date) + " " + time
