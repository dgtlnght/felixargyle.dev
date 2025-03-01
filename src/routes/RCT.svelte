<!DOCTYPE html>
<html lang="en">
  
<head>
    <meta charset="UTF-8">
    <meta name="viewport" 
          content="width=device-width, initial-scale=1.0">
    <title>RCT</title>
</head>

<body>
    <div class="container object-center">
        <div id="time">
            <span class="digit" id="min">00</span>
            <span class="txt">Min</span>
            <span class="digit" id="sec">00</span>
            <span class="txt">Sec</span>
            <span class="digit" id="count">00</span>
        </div>
        <div id="buttons">
            <button class="btn" id="start">
                Start</button>

        </div>
    </div>

    <script>
        let startBtn = document.getElementById('start');

        
        let minute = 00;
        let second = 00;
        let count = 00;
        
        startBtn.addEventListener('click', function () {
            timer = true;
            stopWatch();
        });
        
        resetBtn.addEventListener('click', function () {
            timer = false;
            minute = 0;
            second = 0;
            count = 0;
            document.getElementById('min').innerHTML = "00";
            document.getElementById('sec').innerHTML = "00";
            document.getElementById('count').innerHTML = "00";
        });
        
        function stopWatch() {
            if (timer) {
                count++;
        
                if (count == 100) {
                    second++;
                    count = 0;
                }
        
                if (second == 60) {
                    minute++;
                    second = 0;
                }
        
                if (minute == 60) {
                    hour++;
                    minute = 0;
                    second = 0;
                }
        
                let minString = minute;
                let secString = second;
                let countString = count;

        
                if (minute < 10) {
                    minString = "0" + minString;
                }
        
                if (second < 10) {
                    secString = "0" + secString;
                }
        
                if (count < 10) {
                    countString = "0" + countString;
                }
        
                document.getElementById('min').innerHTML = minString;
                document.getElementById('sec').innerHTML = secString;
                document.getElementById('count').innerHTML = countString;
                setTimeout(stopWatch, 10);
            }
        }</script>
</body>
  
</html>