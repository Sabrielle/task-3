var fs = require("fs");

fs.readFile("data/input.json", "utf8", 
	function(error, data) { 
                if(error) throw error; 
                main(JSON.parse(data)); 
    });

function main (input) {
	var hours = 24;
	var output = {
		"schedule": {},
		"consumedEnergy": {
			"value": 0,
			"devices": {}
		}
	};
	var ratesPerHour = [],
		consumedEnergy = {},
		schedule = {};

	input.rates.forEach((item, i, array) => {
		var difference = (item.from < item.to) ? item.to - item.from : item.to - item.from + 24;
		var current = (item.from < 24) ? item.from : item.from - 24;
		var sum = current + difference;
		for (var j = current; j < sum; j++) {
			j = (j < 24) ? j : j - 24;
			if (item.from > item.to) sum = (j === 0) ? difference : sum;
			if (j === 0 && item.from !== 24) sum = sum - (24 - item.from);
			ratesPerHour[j] = {};
			ratesPerHour[j].hour = j;
			ratesPerHour[j].price = item.value;
			ratesPerHour[j].mode = (j >= 7 && j < 21) ? "day" : "night";
			ratesPerHour[j].power = input.maxPower;
		}
	});

	var dayPrice = ratesPerHour.filter(item => item.mode === 'day').sort(orderByProperty('price', 'hour'));
	var nightPrice = ratesPerHour.filter(item => item.mode === 'night').sort(orderByProperty('price', 'hour'));
	var generalPrice = ratesPerHour.sort(orderByProperty('price', 'hour'));
	var sortedDevices = input.devices.sort(orderByPropertyDesc('duration', 'power'));
	ratesPerHour = ratesPerHour.sort(orderByProperty('hour'));

	for (var i = 0; i < hours; i++) {
		schedule[i] = [];
	}

	sortedDevices.forEach((device, num, array) => {
		addToSchedule(device, device.mode);
	});

	output.schedule = schedule;
	output.consumedEnergy.devices = consumedEnergy;
	for (key in consumedEnergy) {
		output.consumedEnergy.value += consumedEnergy[key];
	}

	console.log(output);

	fs.writeFileSync("data/output.json", JSON.stringify(output));

	function addToSchedule(device, mode) {
		if (typeof device.mode !== 'undefined') {
			if (device.mode === 'day' && device.duration < dayPrice.length)
				calculate(device, dayPrice);
			if (device.mode === 'night' && device.duration < nightPrice.length)
				calculate(device, nightPrice);
		} else calculate(device, generalPrice); 
	}

	function calculate(device, array) {
		for (var j = 0; j < device.duration; j++) {
			if (typeof array[j] !== 'undefined') hour = array[j]['hour'];
			if (typeof ratesPerHour[hour] !== 'undefined') {
				while (ratesPerHour[hour].power < device.power) {
					if (typeof(device.mode) !== 'undefined') {
						if (ratesPerHour[hour].mode === device.mode) hour++;
						else {
							console.log('Невозможно добавить устройство в заданный период ' + device.mode);
							return 0;
						}
					} else {
						if (hour < 23) hour++;
						else {
							console.log('Невозможно добавить устройство');
							return 0;
						}
					}
				}
				ratesPerHour[hour].power -= device.power;
				schedule[hour].push(device.id);
				if (typeof consumedEnergy[device.id] !== 'number') consumedEnergy[device.id] = 0;
				consumedEnergy[device.id] += ratesPerHour[hour].price * (device.power * 0.001);
			}
		}
	}

}

function orderByProperty(prop) {
	var args = [].slice.call(arguments, 1);
	return function(a, b) {
		var equality = a[prop] - b[prop];
		if (equality === 0 && arguments.length > 1) {
			return orderByProperty.apply(null, args)(a, b);
		}
		return equality;
	};
}

function orderByPropertyDesc(prop) {
	var args = [].slice.call(arguments, 1);
	return function(a, b) {
		var equality = b[prop] - a[prop];
		if (equality === 0 && arguments.length > 1) {
			return orderByProperty.apply(null, args)(a, b);
		}
		return equality;
	};
}