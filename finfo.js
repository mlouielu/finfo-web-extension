Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}

NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}

function defaultDict(type) {
    var dict = {};
    return {
        get: function (key) {
        if (!dict[key]) {
            dict[key] = type.constructor();
        }
        return dict[key];
        },
        dict: dict
    };
}

function removeOldDivs() {
  document.getElementsByClassName('yolo').remove();
}

function processFees() {
  const regex = /^(\d{1,3}(\,\d{3})*|(\d+))(\.\d{2})? 元/gm;
  const formatter = new Intl.NumberFormat('zh-TW');

  var tabs = [].slice.call(document.getElementsByClassName('premium-tab')).sort(
    function(a, b) {
	  return parseInt(a.getAttribute('data-tab-index')) > parseInt(b.getAttribute('data-tab-index')) ? 1  : -1;
	});
  var contract_end = new defaultDict([]);
  var contract_price = {};
  var proportion_keys = [];
  var proportion_values = [];
  var first_age = 0;

  for (let tab of tabs) {
	let calculate_it = 0;
	let prices = [];

	for (let pd of tab.getElementsByClassName('premium-div')) {
	  if (!pd.classList.contains('hide')) {
		calculate_it = 1;
		if (first_age === 0) {
		  first_age = parseInt(pd.getElementsByClassName('age')[0].textContent.match(/\d+/gm));
		}
	  }

	  if (!calculate_it) {
		continue;
	  }

	  regex.lastIndex = 0;
	  let price_re = regex.exec(pd.getElementsByClassName('price')[0].textContent);
	  if (price_re) {
		let price = parseInt(price_re[1].replace(',', ''));
		prices.push(price);
	  }
	}

	// This tab didn't contain any fee, skip it
	if (!prices.length) {
	  continue;
	}

	// Which year it end?
	contract_name = document.querySelectorAll(`[data-tab-index="${tab.getAttribute("data-tab-index")}"]`)[0].textContent;
	contract_end.get(first_age + prices.length).push(contract_name);

	// Add the contract price
	contract_price[contract_name] = prices;

	// First year proportion
	proportion_keys.push(contract_name);
	proportion_values.push(prices[0]);

	// Align to 5 years
	let align = (5 - (first_age % 5)) % 5;
	let align_age = first_age;
	if (align) {
	  let d = document.createElement('div');
	  let age = document.createElement('div');
	  let price = document.createElement('div');
	  d.className = 'premium-div yolo';
	  age.style = 'background-color: #2ecc71; color: #fff'
	  age.className = 'age';
	  price.className = 'price';
	  d.appendChild(age);
	  d.appendChild(price);

	  age.textContent = `${first_age}~${first_age + align} 歲`
	  price.textContent = formatter.format(prices.slice(0, align).reduce((a, b) => a + b)) + ' 元';
	  tab.appendChild(d);

	  // Move to align year
	  align_age += align;
	}

	// Calculate each 5 years total fees
	for (let i = 0; i < prices.length / 5; ++i) {
	  let d = document.createElement('div');
	  let age = document.createElement('div');
	  let price = document.createElement('div');
	  d.className = 'premium-div yolo';
	  age.style = 'background-color: #2ecc71; color: #fff'
	  age.className = 'age';
	  price.className = 'price';

	  if (!prices.slice(align + i * 5, align + (i + 1) * 5).length) {
		continue;
	  }

	  age.textContent = `${align_age + i * 5}~${align_age + i * 5 + prices.slice(align + i * 5, align + (i + 1) * 5).length - 1} 歲`
	  price.textContent = formatter.format(prices.slice(align + i * 5, align + (i + 1) * 5).reduce((a, b) => a + b)) + ' 元';

	  d.appendChild(age);
	  d.appendChild(price);
	  tab.appendChild(d);
	}

	// Calculate overall fees
	let d = document.createElement('div');
	let age = document.createElement('div');
	let price = document.createElement('div');
	d.className = 'premium-div yolo';
	age.style = 'background-color: #2ecc71; color: #fff'
	age.className = 'age';
	price.className = 'price';
	d.appendChild(age);
	d.appendChild(price);
	age.textContent = '總費用'
	price.textContent = formatter.format(prices.reduce((a, b) => a + b)) + ' 元';
	tab.appendChild(d);
  }

  // Add contract end year to first tab
  let page = document.getElementsByClassName('premium-page')[0];
  let table = document.createElement('div');
  let d = document.createElement('div');
  table.className = 'premium-table yolo';
  d.className = 'premium-tab';

  width = 100 / Object.keys(contract_end.dict).length;
  for (const [k, v] of Object.entries(contract_end.dict)) {
	let pd = document.createElement('div');
	let age = document.createElement('div');
	let price = document.createElement('div');
	pd.className = 'premium-div';
	pd.style = `width: ${width}%`;
	age.className = 'age';
	price.className = 'price';

	age.textContent = `${k} 歲起停繳`;
	for (let name of v) {
	  let p = document.createElement('p');
	  p.textContent = name;
	  price.appendChild(p);
	}

	pd.appendChild(age);
	pd.appendChild(price);
	d.appendChild(pd);
  }

  table.appendChild(d);
  page.appendChild(table);

  // Add total insurace fees proportion
  let total = document.createElement('canvas');
  total.setAttribute('id', 'total-proportion');
  total.setAttribute('height', '150');
  total.className = 'yolo'

  let totaljs = document.createElement('script');
  totaljs.setAttribute('type', 'text/javascript');

  // Remove 總保費
  proportion_values.shift();
  proportion_keys.shift();

  let bgColor = [
	"#FF6384","#4BC0C0","#FFCE56","#D0AFFF","#FFA163",
	"#70879d","#CF9E9E","#879d70","#a8947f","#36A2EB"
  ];

  // Find longest price
  max_price_length = 0
  for (let price of Object.values(contract_price)) {
	if (price.length > max_price_length) {
	  max_price_length = price.length;
	}
  }

  let data = {
	labels: [],
	datasets: []
  }

  // Prepare labels
  for (let i = first_age; i < max_price_length; ++i) {
	data.labels.push(`${i}歲`);
  }

  // Prepare dataset
  for (let i = 0; i < proportion_keys.length; ++i) {
	d = contract_price[proportion_keys[i]];
	d = d.concat(new Array(max_price_length - d.length).fill(0));
	data.datasets.push(
	  {
		label: proportion_keys[i],
		data: d,
		backgroundColor: bgColor[i % bgColor.length],
		fill: true
	});
  }

  totaljs.textContent =
    ("var ctx = document.getElementById('total-proportion').getContext('2d');" +
     `new Chart(ctx, {
      options: {
        scales: {
          xAxes: [{ stacked: true }],
          yAxes: [{ stacked: true }]
        },
        plugins: { stacked100: {enable: true} }
      },
      type: 'line',
      data: ${JSON.stringify(data)}});`);

  let proportion = document.createElement('canvas');
  proportion.setAttribute('id', 'proportion');
  proportion.setAttribute('height', '40');
  proportion.className = 'yolo';

  let proportionjs = document.createElement('script');
  proportionjs.setAttribute('type', 'text/javascript');

  data.labels = ['總保費比值'];
  data.datasets = [];

  for (let i = 0; i < proportion_keys.length; ++i) {
	data.datasets.push(
	  {
		label: proportion_keys[i], data: [proportion_values[i]],
		backgroundColor: bgColor[i % bgColor.length]
	});
  }

  proportionjs.textContent =
    ("var ctx = document.getElementById('proportion').getContext('2d');" +
     `new Chart(ctx, {
      options: {
        tooltips: {   mode: 'nearest' },
        plugins: { stacked100: {enable: true} }
      },
      type: 'horizontalBar',
      data: ${JSON.stringify(data)}});`);


  page.appendChild(proportion);
  page.appendChild(total);
  page.appendChild(proportionjs);
  page.appendChild(totaljs);
}


var observer = new MutationObserver(function(mutations) {
  removeOldDivs();
  processFees();
});

observer.observe(document.getElementsByClassName('total-premium')[0],
				 { childList: true, subtree: true });
