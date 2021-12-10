const express = require('express');
const router = express.Router();
const moment = require('moment');
const connection = require("../connection");

const getDustStatus = (value) => {
  if (value <= 30) {
    return 'blue'
  } 
  else if (value > 30 && value <= 80) {
    return 'green'
  }
  else if (value > 80 && value <= 150) {
    return 'yellow'
  }
  else if (value > 150 && value <= 600) {
    return 'red'
  }
  else {
    return 'blue'
  }
}

const getUltraFineDustStatus = (value) => {
  if (value <= 15) {
    return 'blue'
  } 
  else if (value > 15 && value <= 35) {
    return 'green'
  }
  else if (value > 35 && value <= 75) {
    return 'yellow'
  }
  else if (value > 75 && value <= 500) {
    return 'red'
  }
  else {
    return 'blue'
  }
}

/* GET info page. */
router.get('/', (req, res, next) => {
  const query = `
    SELECT MAX(pm10_0) AS dust, 
           MAX(pm2_5) AS ultrafine, 
           AVG(windDirection) AS windDirection, 
           ROUND(AVG(substr(windSpeed, 1, 3)), 2) AS windSpeed, 
           ROUND(AVG(temperature), 1) As temperature,
           ROUND(AVG(humidity), 1) AS humidity,
           rgst_dt 
    FROM finedust_tb 
    GROUP BY SUBSTR(rgst_dt, 1, 13) 
    ORDER BY rgst_dt DESC
    LIMIT 30
  `;

  // const dustData = `
  //   SELECT COUNT(case when pm10_0<=30 then 1 else 0 END) AS goodDust10_0,
  //          COUNT(IF(pm10_0<=30, 1, 0)) AS goodDust10_0,
	// 	       COUNT(case when pm2_5<=15 then 1 END) AS goodDust2_5,
  //          COUNT(case when pm10_0>30 then 1 END AND case when pm10_0<=80 then 1 END) AS normalDust10_0,
  //          COUNT(case when pm2_5>15 then 1 end AND case when pm2_5<=35 then 1 end) AS normalDust2_5,
  //          COUNT(case when pm10_0>80 then 1 END AND case when pm10_0<=150 then 1 END) AS badDust10_0,
  //          COUNT(case when pm2_5>35 then 1 end AND case when pm2_5<=75 then 1 end) AS badDust2_5,
  //          COUNT(case when pm10_0>150 then 1 END AND case when pm10_0<=600 then 1 END) AS veryBadDust10_0,
  //          COUNT(case when pm2_5>75 then 1 end AND case when pm2_5<=500 then 1 end) AS veryBadDust2_5
  //     FROM finedust_tb
  // `;
  // + dustData
  connection.query(query, (err, rows, fields) => {
    if (!err) {
      res.render('content/info', {'datas': rows.map(data => {
                                            return {
                                              dust: data.dust,
                                              dustStatus: getDustStatus(data.dust),
                                              ultrafine: data.ultrafine,
                                              ultrafineStatus: getUltraFineDustStatus(data.ultrafine),
                                              windDirection: data.windDirection,
                                              windSpeed: data.windSpeed,
                                              temperature: data.temperature,
                                              humidity: data.humidity,
                                              rgst_dt: moment(data.rgst_dt).format('MM-DD : HH')
                                              // ,goodDust10_0: data.goodDust10_0,
                                              // goodDust2_5: data.goodDust2_5,
                                              // normalDust10_0: data.normalDust10_0,
                                              // normalDust2_5: data.normalDust2_5,
                                              // badDust10_0: data.badDust10_0,
                                              // badDust2_5: data.badDust2_5,
                                              // veryBadDust10_0: data.veryBadDust10_0,
                                              // veryBadDust2_5: data.veryBadDust2_5
                                            }
                                          })
                                  });
    }
    else {
      console.log(err);
      res.render('content/info', err);
    }
  })
})

router.get('/api/search', (req, res, next) => {
  const params = req.query;
  const start = `${params.startDate} ${params.startTime}:00:00`;
  const end = `${params.endDate} ${params.endTime}:00:00`;
  
  const query = `
    SELECT MAX(pm10_0) AS dust, 
           MAX(pm2_5) AS ultrafine, 
           AVG(windDirection) AS windDirection, 
           ROUND(AVG(substr(windSpeed, 1, 3)), 2) AS windSpeed, 
           ROUND(AVG(temperature), 1) As temperature,
           ROUND(AVG(humidity), 1) AS humidity,
           rgst_dt 
    FROM finedust_tb WHERE rgst_dt >= '${start}' AND rgst_dt <= '${end}' 
    GROUP BY SUBSTR(rgst_dt, 1, ${params.time}) 
    ORDER BY rgst_dt DESC 
  `;

  // const dustData = `
  //     SELECT COUNT(case when pm10_0<=30 then 1 END) AS goodDust10_0,
  //           COUNT(case when pm2_5<=15 then 1 END) AS goodDust2_5,
  //           COUNT(case when pm10_0>30 then 1 END AND case when pm10_0<=80 then 1 END) AS normalDust10_0,
  //           COUNT(case when pm2_5>15 then 1 end AND case when pm2_5<=35 then 1 end) AS normalDust2_5,
  //           COUNT(case when pm10_0>80 then 1 END AND case when pm10_0<=150 then 1 END) AS badDust10_0,
  //           COUNT(case when pm2_5>35 then 1 end AND case when pm2_5<=75 then 1 end) AS badDust2_5,
  //           COUNT(case when pm10_0>150 then 1 END AND case when pm10_0<=600 then 1 END) AS veryBadDust10_0,
  //           COUNT(case when pm2_5>75 then 1 end AND case when pm2_5<=500 then 1 end) AS veryBadDust2_5
  //       FROM finedust_tb WHERE rgst_dt >= '${start}' AND rgst_dt <= '${end}'
  //   `;

  // + dustData
  connection.query(query, (err, rows, fields) => {
    if (!err) {
      let result;
      const dateFormat = {'13': 'MM-DD : HH', '10': 'MM-DD', '18': 'MM-DD HH:mm:ss'};

      rows.forEach(data => {
        const html = `
          <tr>
            <td>${moment(data.rgst_dt).format(dateFormat[params.time])}</td>
            <td class="${getDustStatus(data.dust)}">●</td>
            <td>${data.dust}</td>
            <td class="${getUltraFineDustStatus(data.ultrafine)}">●</td>
            <td>${data.ultrafine}</td>
            <td>
              <img class="wind-direction-icon" src="images/arrow-icon.png" alt="wind-direction" style="width: 40px; transform: rotate(${data.windDirection}deg);" />
            </td>
            <td>${data.windSpeed} (m/s)</td>
            <td>${data.temperature} °C</td>
            <td>${data.humidity} %</td>
          </tr>
        `
        result += html;
      });

      // rows.forEach(data => {
      //   $("p.goodDust").text(data.goodDust);
      //   $("p.normalDust").text(data.normalDust);
      //   $("p.badDust").text(data.badDust);
      //   $("p.veryBadDust").text(data.veryBadDust);

      //   const html = `
      //     <p class="goodDust">${data.goodDust}</p>
      //     <p class="normalDust">${data.normalDust}</p>
      //     <p class="badDust">${data.badDust}</p>
      //     <p class="veryBadDust">${data.veryBadDust}</p>
      //   `
      //   result += html;
      // });

      res.send(result);

      // var good = document.getElementsByClassName('blue').length;
      // document.getElementById("goodCount").innerText = good + "회";
      // var normal = document.getElementsByClassName('green').length;
      // document.getElementById("normalCount").innerText = normal + "회";
      // var bad = document.getElementsByClassName('yellow').length;
      // document.getElementById("badCount").innerText = bad + "회";
      // var veryBad = document.getElementsByClassName('red').length;
      // document.getElementById("veryBadCount").innerText = veryBad + "회";
    }
    else {
      console.log(err);
      res.send(err);
    }
  })
})

module.exports = router;