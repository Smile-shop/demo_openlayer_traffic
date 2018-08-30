(function($, window) {
  function CC(opts) {
    var me = this;



    me.conf = {
      // 
      gd_map: {
        zoom: 4,
        zooms: [3, 18],
      },
      // 地图
      ol_map: {
        center: [116.404844, 39.914935],
        minZoom: 4,
        maxZoom: 18,
      },

      // traffic
      traffic: {
        // 路线的框
        w: 6,
        // 
        style: null,
      },

      // 经纬度方向的分的点数
      y: 20,
      x: 20,
    };
    me.conf.traffic.style = {

      // 
      "未知": new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgb(173,173,173)',
          width: me.conf.traffic.w,
        }),
      }),
      // 
      "畅通": new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgb(27,172,46)',
          width: me.conf.traffic.w,
        }),
      }),
      // 
      "缓行": new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgb(255,167,0)',
          width: me.conf.traffic.w,
        }),
      }),
      // 
      "拥堵": new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgb(232,14,14)',
          width: me.conf.traffic.w,
        }),
      }),
      // 
      "严重拥堵": new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgb(142,14,11)',
          width: me.conf.traffic.w,
        }),
      }),
    };


    me.all_obj = {
      // 
      traffic: {
        // 
        layer: null,
        // 数据层
        data_c: null,


        // ======================
        // 屏幕的对角点
        points: null,
        // 屏幕的四个点
        points_4: null,

        // ======================
        // 导航规划工具
        search_tool: null,
        // 搜素到的数据
        search_arr: [],
        // 分组16的数组
        search_arr_16: [],


        // ======================
        // 导航规划工具
        traffic_tool: null,

        // ======================
        // 加载遮罩
        load: null,
      },
    };
  };

  CC.prototype = {
    init: function() {
      var me = this;
      me._bind();
      me._init();
    },
    _bind: function() {
      var me = this;

      var fn = {
        _init: function() {
          // 

          // 高德初始化准备
          me._gd(function() {
            // 加载OL地图
            me._ol_map();
            me._ol_map_ev();

            // 
            // 加载图层
            me._search_traffic_layer();
            // 
            me._search();



          });
        },
        // ===========================================================
        // OL 地图
        _ol_map: function() {
          me.ol_map = new ol.Map({
            target: 'map_ol',
            // 设置地图图层
            layers: [
              //高德地图在线---火星坐标系 gcj02
              new ol.layer.Tile({
                source: new ol.source.XYZ({
                  url: 'http://webrd03.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8'
                }),
                // projection: 'EPSG:4326'
              })
            ],

            // 控件
            controls: ol.control.defaults({
              attributionOptions: ({
                // 是否折叠
                collapsible: false
              })
            }),

            logo: { src: './img/1.png', href: 'http://www.baidu.com' },

            // ol.View 设置显示地图的视图
            view: new ol.View({
              zoom: 12,
              projection: 'EPSG:4326',
              center: me.conf.ol_map.center,
              maxZoom: me.conf.ol_map.maxZoom,
              minZoom: me.conf.ol_map.minZoom,
            }),
          });
        },
        _ol_map_ev: function() {
          me.ol_map.getView()
            .on('change:center', function() {

              me._search();
            });
        },


        // 层和容器
        _search_traffic_layer: function() {

          // 矢量容器层
          me.all_obj.traffic.layer = new ol.layer.Vector();

          // 注入数据层--可以注入多个Feature，每个feature有自己的数据和样式
          me.all_obj.traffic.data_c = new ol.source.Vector();

          // 
          me.all_obj.traffic.layer.setSource(me.all_obj.traffic.data_c);

          // 打到地图上
          me.ol_map.addLayer(me.all_obj.traffic.layer);
        },



        // ===========================================================
        _search: function() {
          // 清除画布
          me.all_obj.traffic.data_c.clear();
          me._search_view_data();

          // me.all_obj.traffic.load = layer.load(0, { shade: 0.5 });
          me._search_init(function() {

            // 数据处理
            me._search_data_handle();

            // 渲染
            me._search_data_inj(0);
          });
        },
        // 初始化需要的数据
        _search_view_data: function() {
          // 对角点
          me.all_obj.traffic.points = me.ol_map.getView().calculateExtent(me.ol_map.getSize());
          var old = me.all_obj.traffic.points;
          // console.log(old);

          // 左上
          var l_t = [old[0], old[3]];
          // 右上
          var r_t = [old[2], old[3]];

          // 右下
          var r_b = [old[2], old[1]];
          // 左下
          var l_b = [old[0], old[1]];

          // 屏幕的四个点
          me.all_obj.traffic.points_4 = [
            l_t, r_t, r_b, l_b
          ];
        },
        // 搜索初始化
        _search_init: function(cb) {
          me.all_obj.traffic.search_arr.length = 0;
          me._search_start("国道")
            .then(function(arr) {
              me._search_gen_arr(arr);

              return me._search_start("省道");
            })
            .then(function(arr) {
              me._search_gen_arr(arr);

              return me._search_start("县道");
            })
            .then(function(arr) {
              me._search_gen_arr(arr);

              return me._search_start("高速");
            })
            // .then(function(arr) {
            //   me._search_gen_arr(arr);

          //   return me._search_start("高速口");
          // })
          // .then(function(arr) {
          //   me._search_gen_arr(arr);

          //   return me._search_start("路口");
          // })
          .then(function(arr) {
            me._search_gen_arr(arr);

            // console.log(me.all_obj.traffic.search_arr);
            cb && cb();
          });
        },
        // 开始搜索
        _search_start: function(key) {
          return new Promise(function(resolve, reject) {
            me.all_obj.traffic.search_tool
              .searchInBounds(
                // 
                key,
                // 
                new AMap.Polygon({
                  path: me.all_obj.traffic.points_4,
                }),
                // 
                function(status, result) {
                  // console.log();
                  resolve(result.poiList.pois);
                });
          });
        },
        // 搜索后的数据推入数组
        _search_gen_arr: function(arr) {
          arr.forEach(function(ele, index) {
            me.all_obj.traffic.search_arr.push(ele);
          });
        },
        // ===============================
        // 拿到的数据进行处理
        _search_data_handle: function() {
          // console.log(me.all_obj.traffic.search_arr);
          // // 标识
          // me.all_obj.traffic.search_arr.forEach(function(ele, index) {
          //   me._marker(ele.location);
          // });



          var p_arr = [];
          var s_arr = [];
          var index_limit = 0;
          me.all_obj.traffic.search_arr.forEach(function(ele, index) {
            // 
            if (index % 16 == 0) {
              index_limit = index + 16;
              // console.log(index_limit);
              s_arr = [];
            }
            // 满16的数据
            if (index_limit < me.all_obj.traffic.search_arr.length) {
              s_arr.push(ele);

              if (s_arr.length == 16) {
                p_arr.push(s_arr);
              }
            }
            // 不满16
            else {
              s_arr.push(ele);

              if (index == me.all_obj.traffic.search_arr.length - 1) {
                p_arr.push(s_arr);
              }
              // console.log(s_arr)
            }
          });

          me.all_obj.traffic.search_arr_16.length = 0;
          me.all_obj.traffic.search_arr_16 = p_arr;

          // console.log(me.all_obj.traffic.search_arr_16);
        },
        // ===============================
        // 拿到的数据进行渲染
        _search_data_inj: function(index) {
          // 拿到数据
          var p_obj = me._search_one_line_data(me.all_obj.traffic.search_arr_16[index], index);
          // console.log(p_obj);
          // return;
          // 渲染数据
          me._search_one_line_init(p_obj, function() {
            index++;
            if (index == me.all_obj.traffic.search_arr_16.length) {
              layer.close(me.all_obj.traffic.load);
              return;
            }
            me._search_data_inj(index);
          });
        },
        // 一条线的数据生成
        _search_one_line_data: function(line_arr, line_index) {
          // console.log(line_arr, line_index);


          var start_line = null,
            end_line = null,
            start_p = null,
            end_p = null;
          // 第一条线
          if (line_index == 0) {
            start_line = me.all_obj.traffic.search_arr_16[me.all_obj.traffic.search_arr_16.length - 1];
            end_line = me.all_obj.traffic.search_arr_16[line_index + 1];
          }
          // 最后一根线
          else if (line_index == (me.all_obj.traffic.search_arr_16.length - 1)) {
            start_line = me.all_obj.traffic.search_arr_16[line_index - 1];
            end_line = me.all_obj.traffic.search_arr_16[0];
          }
          // 中间线
          else {
            start_line = me.all_obj.traffic.search_arr_16[line_index - 1];
            end_line = me.all_obj.traffic.search_arr_16[line_index + 1];
          }
          // console.log(start_line);
          // console.log(end_line);

          // 
          start_p = start_line[start_line.length - 1];
          end_p = end_line[0];

          // console.log(start_p);
          // console.log(end_p);

          // 
          var waypoints = [];
          line_arr.forEach(function(p, index) {
            waypoints.push(new AMap.LngLat(p.location.lng, p.location.lat));
          });

          return {
            start_p: new AMap.LngLat(start_p.location.lng, start_p.location.lat),
            end_p: new AMap.LngLat(end_p.location.lng, end_p.location.lat),
            waypoints: waypoints,
          };
        },
        // ======================================
        // 渲染数据
        _search_one_line_init: function(p_obj, cb) {

          me.all_obj.traffic.traffic_tool
            .search(p_obj.start_p, p_obj.end_p, { waypoints: p_obj.waypoints },
              function(status, result) {
                // console.log(result.routes[0].steps);
                // 渲染
                me._search_traffic_lines(result.routes[0].steps);

                // 
                cb && cb();
              }
            );
        },
        // 渲染数据
        _search_traffic_lines: function(arr) {

          arr.forEach(function(ele, index) {
            ele.tmcsPaths.forEach(function(line, index) {
              me._search_traffic_one_inj(line);
            });
          });
        },
        // 单个数据
        _search_traffic_one_inj: function(line) {
          // console.log(line);
          if (line.status == '未知') {
            return;
          }
          // 数据处理
          var new_line = [];
          line.path.forEach(function(p, index) {
            new_line.push([p.lng, p.lat])
          });


          var _data = new ol.Feature({
            geometry: new ol.geom.LineString(new_line)
          });

          _data.setStyle(me.conf.traffic.style[line.status]);

          // 注入数据层
          me.all_obj.traffic.data_c.addFeature(_data);
        },




























        // ==========================================
        // 高德初始化
        _gd: function(cb) {
          me.gd_map = new AMap.Map("map_gd", {
            zoom: me.conf.gd_map.zoom,
            zooms: me.conf.gd_map.zooms,
          });
          me.gd_map.on('complete', function(e) {
            // 搜索插件
            me.gd_map.plugin(["AMap.PlaceSearch"], function() {
              //构造路线导航类
              me.all_obj.traffic.search_tool = new AMap.PlaceSearch({ //构造地点查询类
                pageSize: 50,
                pageIndex: 1,
                map: me.gd_map,
                children: 1,
                type: '道路附属设施|交通设施服务|地名地址信息',
                extensions: "all",
              });



              // cb && cb();
              // 导航插件
              me.gd_map.plugin(["AMap.Driving"], function() {
                //构造路线导航类
                me.all_obj.traffic.traffic_tool = new AMap.Driving({
                  map: me.gd_map,
                });



                cb && cb();
              });
            });
          });
        },

























































        // =====================最优视角
        // 图最优
        _ol_map_fit: function(data_c) {
          // console.log(data_c.getFeatures());

          // 整个容器每个元素的最小最大 集合数组
          var point_arr = [];
          data_c.getFeatures().forEach(function(ele, index) {
            point_arr.push(_one(ele.getGeometry()));
          });


          // 假设第一个点为最合适的点
          var fit_point = point_arr[0];
          point_arr.forEach(function(point, index) {

            // 最小经度
            if (point[0] < fit_point[0]) {
              fit_point[0] = point[0];
            }

            // 最小纬度
            if (point[1] < fit_point[1]) {
              fit_point[1] = point[1];
            }

            // 最大经度
            if (point[2] > fit_point[2]) {
              fit_point[2] = point[2];
            }

            // 最大纬度
            if (point[3] > fit_point[3]) {
              fit_point[3] = point[3];
            }
          });

          // 没有数据
          if (data_c.getFeatures().length == 0) {
            return;
          }
          // 单个DOM
          else if (data_c.getFeatures().length == 1) {

            me.ol_map.getView()
              .centerOn(
                [fit_point[0], fit_point[1]],
                me.ol_map.getSize(), [$(document).width() / 2, $(document).height() / 2]);

            me.ol_map.getView().setZoom(12);
          }
          // 多个dom
          else {
            me.ol_map.getView()
              .fit(fit_point, {
                size: me.ol_map.getSize(),
                padding: [100, 100, 100, 100],
                constrainResolution: false
              });
          }


          // 单个点的最小经纬度/最大经纬度
          function _one(dom) {
            // 4点数组
            var one_p = null;
            // 类型
            var type = dom.getType();

            // 每个类型的坐标值
            var path = dom.getCoordinates();

            if (type == 'Point') {
              one_p = [path[0], path[1], path[0], path[1]];
            }
            // 多边形
            else if (type == 'Polygon') {

              var line_path = path[0];
              one_p = [line_path[0][0], line_path[0][1], line_path[0][0], line_path[0][1]];

              line_path.forEach(function(p, index) {
                // 最小经度
                if (p[0] < one_p[0]) {
                  one_p[0] = p[0];
                }
                // 最小纬度
                if (p[1] < one_p[1]) {
                  one_p[1] = p[1];
                }


                // 最大经度
                if (p[0] > one_p[2]) {
                  one_p[2] = p[0];
                }
                // 最大纬度
                if (p[1] > one_p[3]) {
                  one_p[3] = p[1];
                }
              });
            }
            // 线
            else if (type == 'LineString') {
              one_p = [path[0][0], path[0][1], path[0][0], path[0][1]];

              path.forEach(function(p, index) {
                // 最小经度
                if (p[0] < one_p[0]) {
                  one_p[0] = p[0];
                }
                // 最小纬度
                if (p[1] < one_p[1]) {
                  one_p[1] = p[1];
                }


                // 最大经度
                if (p[0] > one_p[2]) {
                  one_p[2] = p[0];
                }
                // 最大纬度
                if (p[1] > one_p[3]) {
                  one_p[3] = p[1];
                }
              });
            }
            // 圆
            else if (type == 'Circle') {
              path = dom.getCenter();
              one_p = [path[0], path[1], path[0], path[1]];
            }

            return one_p;
          }
        },
        // 点的转向角度设置  new_p 上一点的坐标 old_p 下一点的坐标
        _ol_map_p_rotation: function(new_p, old_p) {
          // 90度的PI值
          var pi_90 = Math.atan2(1, 0);
          // 当前点的PI值
          var pi_ac = Math.atan2(new_p[1] - old_p[1], new_p[0] - old_p[0]);

          return pi_90 - pi_ac;
        },


        _marker: function(p_obj) {
          var p_data = new ol.Feature({
            // 就一个参数啊，定义坐标
            geometry: new ol.geom.Point([p_obj.lng, p_obj.lat]),
          });

          p_data.setStyle(new ol.style.Style({
            // 设置一个标识
            image: new ol.style.Icon({
              src: './img/start.png',

              // 这个是相当于是进行切图了
              // size: [50,50],

              // 注意这个，竟然是比例 左上[0,0]  左下[0,1]  右下[1，1]
              anchor: [0.5, 1],
              // 这个直接就可以控制大小了
              scale: 0.3
            }),
          }));

          // 数据层收集
          me.all_obj.traffic.data_c.addFeature(p_data);
        },








      };


      for (var k in fn) {
        me[k] = fn[k];
      };
    },
  };
  window.CC = CC;
})(jQuery, window);
