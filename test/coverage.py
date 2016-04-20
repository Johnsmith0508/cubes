#!/bin/python
import re

file = open('/var/www/node1/js/GUI.js','r').read().splitlines()
i = 0
for element in file:
  i+=1
  #remove all leading tabs
  str = element.replace("\t","")
  #all lines containing 'functions' and not starting with '//' or '@'
  m = re.search("^(?!@)(?!\/\/).*function.*$",str)
  if m:
    print("{} on line {} accepts:".format(str,i))
    #get everything inside of parens
    unparsedArgs = re.search("(?<=\().*(?=\))",str)
    if unparsedArgs:
      args = unparsedArgs.group(0).split(",")
      for j in args:
        print(j.replace(" ",""))
        
      beginingofcomment = 0
      endofcomment = 0
      for it in range(i-15,i):
        if re.search("(\/\*\*).*",file[it]):
          #print(file[it])
          beginingofcomment = it
        if re.search(".*(\*\/)",file[it]):
          endofcomment = it
          #print(file[it])
      for k in range(beginingofcomment,endofcomment):
        lineValue = file[k].replace(" ","").replace("\t","")
        if re.search("^(@param).*",lineValue):
          varName = re.search("(?<=})(.*)(?=-)",lineValue)
          #TODO: deal with optional variables (`[]`)
          print("found docs for {} on line {}, cool!".format(varName.group(0),k+1))
        #planning
        #
        #find lines that start with `@param`
        #loop through args array and remember that the match has been made
        
        #print(file[it])
        
# ---GAME PLAN THING---
# loop from begining_of_comment to end_of_comment
# somehow match each string preceded by @param with thoes in args array
# bitch at user if there is a mismatch