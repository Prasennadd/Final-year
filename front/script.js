let historyStack = [];
let currentIndex = -1;


    const k = document.getElementById('M');
    k.addEventListener('click', () => {
        k.style.border="solid 3px black";
        k.style.borderRadius="10px";
        k.classList.add('hide-animation'); // makes animation invisible
    });

function updateClock() {
  const now = new Date();
  const clock = document.getElementById('clock');
  if (clock) {
    clock.textContent = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}
setInterval(updateClock, 1000);
updateClock();

const searchBox = document.getElementById('searchBox');
const suggestionsList = document.getElementById('suggestions');

// ✅ Autocomplete suggestions (using Datamuse API)
searchBox?.addEventListener('input', async () => {
  const input = searchBox.value.trim();
//   console.log(input);

const B = document.querySelector('.mainbar');
B?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const query = B.value.trim();
    if (query === '') return;
    navigateTo(`/search?q=${encodeURIComponent(query)}`, query);
  }
});




  suggestionsList.innerHTML = '';

  if (input === '') return;

  try {
    const res = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(input)}`);
    const suggestions = await res.json();

    suggestions.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.word;
      li.onclick = () => {
        searchBox.value = item.word;
        const top=document.getElementById('bar');
        top.style.opacity=1;
        suggestionsList.innerHTML = '';
        navigateTo(`/search?q=${encodeURIComponent(item.word)}`, item.word);
      };
      suggestionsList.appendChild(li);
    });
  } catch (err) {
    console.error('Suggestion fetch error:', err);
  }
});

function l(tar) {
  const val = tar.innerText.trim();
  navigateTo(`/search?q=${encodeURIComponent(val)}`, val);
}

// ✅ Handle ENTER in top address bar
const addressBar = document.querySelector('.address-bar');
addressBar?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const query = addressBar.value.trim();
    if (query === '') return;
    navigateTo(`/search?q=${encodeURIComponent(query)}`, query);
  }
});

function navigateTo(url, query = '') {
  if (currentIndex < historyStack.length - 1) {
    historyStack = historyStack.slice(0, currentIndex + 1);
  }
  historyStack.push({ url, query });
  currentIndex++;

  renderPage(url, query);
}

// ✅ Renders page OR search results
function renderPage(url, queryValue = '') {
  const browserWindow = document.querySelector('.browser-window');

  if (url.includes('/search')) {
    fetch(`http://127.0.0.1:5000${url}`)
      .then(res => res.json())
      .then(results => {
        // ✅ Properly handle "no results"
        if (!results || results.length === 0) {
          browserWindow.innerHTML = `
            <div class="top-bar">

              <button class="nav-btn" onclick="location.reload()"><i class="fas fa-redo"></i></button>
              <input type="text" class="address-bar"  value="${queryValue}" />
            </div>
            <div class="search-results">
              <p>No results found for <b>${queryValue}</b></p>
            </div>
          `;
          bindAddressBar();
          return;
        }

        // ✅ Display results
        browserWindow.innerHTML = `
                <div class="top-bar">
                  <div class="t">
                    <button class="nav-btn" onclick="location.reload()">
                      <i class="fas fa-redo"></i>
                    </button>
                    <input type="text" class="address-bar" value="${queryValue}" />
                  </div>

                  <div class="sort">
                    <!-- time dropdown -->
                    <div class="place" id="time" onclick="this.classList.toggle('open')">
                      Any Time
                      <ul class="dropdown">
                        <li>Past hour</li>
                        <li>Past 24 hours</li>
                        <li>Past week</li>
                        <li>Past month</li>
                        <li>Past year</li>
                      </ul>
                    </div>

                    <!-- place dropdown -->
                    <div class="place" onclick="this.classList.toggle('open')">
                      Any Place
                      <ul class="dropdown">
                        <li>India</li>
                        <li>New York</li>
                        <li>London</li>
                        <li>Tokyo</li>
                      </ul>
                    </div>
                  </div>
                </div>
          <div class="search-results">
            ${results.map(r => `
              <div class="result">
                <a href="${r.url}" target="_blank"><h3>${r.title}</h3></a>
                <p>${r.description}</p>
              </div>
            `).join('')}
          </div>
        `;
        bindAddressBar();
      })
      .catch(err => {
        console.error("Fetch error:", err);
      });
    return;
  }

  // Default case (like opening websites in iframe)
  browserWindow.innerHTML = `
    <div class="top-bar">
      <button class="nav-btn" onclick="goBack()"><i class="fas fa-arrow-left"></i></button>
      <button class="nav-btn" onclick="goForward()"><i class="fas fa-arrow-right"></i></button>
      <button class="nav-btn" onclick="location.reload()"><i class="fas fa-redo"></i></button>
      <input type="text" class="address-bar" value="${queryValue}" />
    </div>
    <iframe id="browser-frame" class="browser-frame" src="${url}"></iframe>
  `;
  bindAddressBar();
}

function bindAddressBar() {
  const newAddressBar = document.querySelector('.address-bar');
  newAddressBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = newAddressBar.value.trim();
      if (query === '') return;
      navigateTo(`/search?q=${encodeURIComponent(query)}`, query);
    }
  });
}

function goBack() {
  if (currentIndex > 0) {
    currentIndex--;
    const { url, query } = historyStack[currentIndex];
    renderPage(url, query);
  }
}

function goForward() {
  if (currentIndex < historyStack.length - 1) {
    currentIndex++;
    const { url, query } = historyStack[currentIndex];
    renderPage(url, query);
  }
}
