#!/bin/python
import re

file = open('/var/www/node1/js/GUI.js','r').read().splitlines()
i = 0
for element in file:
  documentedArgs = []
  i+=1
  #remove all leading tabs
  str = element.replace("\t","")
  #all lines containing 'function' and not starting with '//' or '@'
  m = re.search("^(?!@)(?!\/\/).*function.*$",str)
  if m:
    unparsedArgs = re.search("(?<=\().*(?=\))",str)
    if unparsedArgs:
      args = unparsedArgs.group(0).split(",")
        
      beginingofcomment = len(file)
      endofcomment = 0
      for it in range(i-15,i):
        if re.search("(\/\*\*).*",file[it]):
          beginingofcomment = it
        if re.search(".*(\*\/)",file[it]):
          endofcomment = it
      for k in range(beginingofcomment,endofcomment):
        lineValue = file[k].replace(" ","").replace("\t","")
        if re.search("^(@param).*",lineValue):
          varName = re.search("[^-]*",re.search("(?<=})(.*)(?=-)",lineValue).group(0))
          documentedArgs.append(varName.group(0).replace("[","").replace("]",""))
          
      for j in args:
        foundMatch = False
        for k in documentedArgs:
          if j.replace(" ","") == k.replace(" ",""):
            foundMatch = True
            
        if not foundMatch and len(j) > 0:
          print("there is no documentation for `{}`. see line {}".format(j,i))
