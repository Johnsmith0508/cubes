#!/bin/bash
declare -a payload
i=0
x="$(curl -s localhost/status)"
readarray -t y <<<"${x}"
echo ${y[2]}
for data in ${y[2]}
do
  echo "$data"
  let "i++"
  
  if [ "$i" -eq "1" ]; then
    let "${payload[1]}" "$data"
  fi
  
  if [ "$i" -eq "2" ]; then
    let "${payload[2]}" "$data"
  fi
done

curl -H "X-Cachet-Token: I34g58C5c47c2ZqVvTwk" --data "value=${payload[1]}" https://cachettest-dynalogic.rhcloud.com/api/v1/metrics/1/points