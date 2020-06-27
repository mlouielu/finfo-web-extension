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

function removeOldDivs() {
  document.getElementsByClassName('yolo').remove();
}

function processFees() {
  const regex = /^(\d{1,3}(\,\d{3})*|(\d+))(\.\d{2})? 元/gm;
  const formatter = new Intl.NumberFormat('zh-TW');

  var tabs = document.getElementsByClassName('premium-tab');
  for (let tab of tabs) {
	let first_age = 0;
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

	// Align to 5 years
	let align = (5 - (first_age % 5)) % 5;
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
	  first_age += align;
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

	  age.textContent = `${first_age + i * 5}~${first_age + i * 5 + prices.slice(align + i * 5, align + (i + 1) * 5).length - 1} 歲`
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
}

var observer = new MutationObserver(function(mutations) {
  removeOldDivs();
  processFees();
});

observer.observe(document.getElementsByClassName('total-premium')[0],
				 { childList: true, subtree: true });
