
    function calculateCBM() {
        var length = parseFloat(document.getElementById('length').value);
        var width = parseFloat(document.getElementById('width').value);
        var height = parseFloat(document.getElementById('height').value);
        
        if (isNaN(length) || isNaN(width) || isNaN(height)) {
            document.getElementById('result').innerHTML = "请输入所有维度的有效数字";
        } else {
            var cbm = (length * width * height) / 1000000;
            document.getElementById('result').innerHTML = "CBM: " + cbm.toFixed(3) + " 立方米";
        }
    }