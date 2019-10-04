# NodeGraph
### import
```html
// d3
<script src="http://d3js.org/d3.v3.min.js"></script>
// nodegraph css
<link rel="stylesheet" href="css/nodegraph.css" />
// nodegraph js
<script src="js/nodegraph.js" charset="utf-8"></script>
// jQuery
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
```

### graph용 div와 table용 div설정
```html
<div class="node_graph" id="node_graph"></div>
<div class="node_table" id="node_table"></div>
```

### data shape 
```json
Object parameter object
{
    type: 'string',
    from: 'string',
    to: 'string',
    tx: 'string'
}
Array parameter array
[
    {
        type: 'string',
        from: 'string',
        to: 'string',
        tx: 'string'
    }
]
Object chart_data
{
    nodes: [],
    links: [],
    txs: new Map()
}
Object node
{
    name: 'string'
}
Object link
{
    source: 'string',
    target: 'string',
    tx: 'string',
    index: number
}
```

# 외부로 노출되는 function

## 1. 실시간
## prepare_draw_chart()

### 실시간 차트를 그리기위해 해당 function을 먼저 호출해야함. 해당 function은 실시간으로 넘어오는 데이터를 받아서 처리하는 Timer를 실행하고 데이터가 들어오기를 기다리는 function
```javascript
graph.prepare_draw_chart();
```

## input_realtime_data(data)
```
data: array_data shape형태의 데이터set
```
### data를 받아서 Chart의 Queue에 적재함. Chart가 정지되어도 데이터는 계속 받아서 적재하고 있음.
```javascript
graph.input_realtime_data(data);
```



## start()
### 정지되었던 실시간 차트그리기를 지속함. 실시간의 경우에는 queue에 쌓여있던 데이터를 모두 소진하고 start한 시점부터 다시 그림
```javascript
graph.start();
```

## stop()
### 실시간 차트 그리기를 정지함. 데이터는 계속 수집하여 적재함.
```javascript
graph.stop();
```

## 2. 특정구간
## input_step_data(data, duration, interval, spec)
```
data: array_data shape형태의 데이터set
duration: 그리는 간격 ms기준(최소값은 25ms)
interval: 그리는 간격을 늘리거나 줄일때의 간격 ms기준(최소값은 25ms)
```
### 특정 구간의 데이터를 그릴때 사용. 
```javascript
graph.input_step_data(data, 1000, 500);
```

## start()
### 중지되었던 차트그리기를 시작함. 차트그리기가 완료된 경우 처음부터 시작함.
```javascript
graph.start();
```

## stop()
### 차트그리기를 중지함.
```javascript
graph.stop();
```

## stepTick()
### 차트를 한 tick당 진행함.
```javascript
graph.stepTick();
```

## toSlow()
### interval만큼 차트의 duration을 늦춤 - max 60000ms
```javascript
graph.toSlow();
```

## toFast()
### interval만큼 차트의 duration을 빠르게함 - min 25ms
```javascript
graph.toFast();
```

## toPrev()
### 실시간 차트에서 Step Chart로 넘어온경우 다시 실시간 차트로 넘어감.
```javascript
graph.toPrev();
```

## rewind()
### 테이블에 있는 데이터를 되감기함.
```javascript
graph.rewind();
```

## 3. 공통 - 성능상 사용을 권장하지는 않음.
##  ableLink()
### 차트의 Node와 Link를 사용하여 Node가 연결되는 애니메이션을 추가함.
```javascript
graph.ableLink();
```
## disableLink() - default
### 차트의 Node와 Link를 사용하지 않음.
```javascript
graph.disableLink();
```
## startScroll() - default
### 현재 차트가 그려지는 마지막 데이터가 위치한 곳으로 테이블의 스크롤을 내림
```javascript
graph.startScroll();
```
## stopScroll()
### 스크롤 자동이동을 방지함.
```javascript
graph.stopScroll();
```

# 2. 내부에서 호출하는 function
## circleSize(node)
```javascript
circleSize(node);
```
## circleColor(node)
```javascript
circleColor(node);
```
## custom_update()
```javascript
custom_update();
```
### 전광판과 Node에 커스텀하게 형태를 변경한다.

## sorting_data(a, b)
```javascript
sorting_data(a, b);
```
### table header의 sort값을 기준으로 sorting처리함. default: index, data는 data의 object형

## table_update(table_data)
```javascript
table_update(table_data);
```
### table의 값을 변경함. data는 data의 array형

## chart_update(chart_data)
```javascript
chart_update(chart_data);
```
### chart의 node나 link가 추가 됬을시 화면에 반영함. data는 data의 chart_data형

## findNode(data, name) -> Object
```javascript
findNode(data, 'name');
```
### 특정 name을 가진 Node를 찾아 Node를 반환한다.

## removeAllLinkAndTX()
```javascript
removeAllLinkAndTX();
```
### Chart에서 Node를 제외한 TX리스트 및 Link를 제거한다.

## pushNodeData(node)
```javascript
pushNodeData(node);
```
### chart_data.nodes에 새로은 node를 추가한다. findNode를 통해 Node가 없는 경우에만 추가된다.
### Node가 생성되는 위치, 필요한 parameter를 셋팅한다.

## pushLinkData(link, init_line)
```javascript
pushLinkData(link, true);
```
### chart_data.links에 새로운 link를 추가한다. init_line은 기존 라인을 삭제하지 않고 활용하는 실시간 차트에서 라인을 초기화 처리할 것인가 여부를 묻는다.

## removeLink(link)
```javascript
removeLink(link);
```
### 해당 링크를 제거한다. rewind를 위해 사용하며 link시 했던 process를 반대로 진행한다.

## addNodeAndLink(tick, update)
```javascript
addNodeAddLink(tick, true);
```
### 단일 Node와 Link를 추가한다. update는 해당 추가된 Node및 Link를 화면에 표현할지 여부를 묻는다.

## multiAddNodeAndLinkRemove(datas, update)
```javascript
multiAddNodeAndLinkRemove(datas, true);
```
### 다중 Node와 Link를 추가한다. 추가하기전에 기존 Link를 전체 삭제처리후 데이터를 추가한다. update는 해당 데이터셋을 화면에 표현할지 여부를 묻는다.

## click_table(type, data)
```javascript
click_table('tx', data);
```
### table에 row 또는 column을 클릭시 동작하는 function type에따라 동작하며 실시간일때는 step으로 step일때는 해당 row부터 시작하게 만드는 역활을 한다. 

## init_real_time()
```javascript
init_real_time();
```
### step형에서 실시간으로 넘갈때 초기화처리

## work_job_onetick(duration) -> Timer
```javascript
timer = work_job_onetick(25);
```
### step상태에서 1개의 tick을 queue가 비울때까지 실행함. duration만큼의 간격으로 실행됨. timer를 반환함.

## work_job_rewind(duration) -> Timer
``` javascript
timer = work_job_rewind(25);
```
### step상태에서 1개의 tick을 stack이 비워질때까지 되돌림. duration만큼의 간격으로 실행됨. timer를 반환함.
