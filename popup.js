// DOM Element References
const siteList = document.getElementById('siteList');
const noteArea = document.getElementById('noteArea');
const openLinkButton = document.getElementById('openLink');
const fileInput = document.getElementById('importFile');

// Utility Functions
// Used callback so that there would be no use of async/await
function getCurrentTabUrl(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    callback(tabs[0].url);
  });
}

// Set the state of openURL button
function manageOpenLinkButtonState(selectedUrl) {
  getCurrentTabUrl((currentUrl) => {
    if (!selectedUrl || selectedUrl == currentUrl) {
      openLinkButton.setAttribute('disabled', 'disabled');
    } else {
      openLinkButton.removeAttribute('disabled');
    }
  });
}

// Retrieve note of specific url
function loadData(url, callback) {
  chrome.storage.local.get(url, (result) => {
    callback(result[url]);
  });
}

// Load all saved site URLs into the dropdown on popup load
chrome.storage.local.get(null, (items) => {
  for (const url in items) {
    const option = document.createElement('option');
    option.value = url;
    option.textContent = url;
    siteList.appendChild(option);
  }
});

// Display note of the selected site
siteList.addEventListener('change', () => {
  const selectedUrl = siteList.value;
  loadData(selectedUrl, (data) => {
    noteArea.value = data || '';
  });
  // Need to check here as this indicates that a new option is selected from dropdown
  manageOpenLinkButtonState(selectedUrl);
});

// Open URL in new tab when clicked
openLinkButton.addEventListener('click', () => {
  const selectedURL = siteList.value;
  chrome.tabs.create({ url: selectedURL });
});

// Save notes
document.getElementById('saveNote').addEventListener('click', () => {
  let url = siteList.value;

  if (!url) {
    getCurrentTabUrl((currentUrl) => {
      saveNote(currentUrl);
    });
  } else {
    saveNote(url);
  }
});

function saveNote(url) {
  const note = noteArea.value;
  const noteObject = {};
  noteObject[url] = note;

  chrome.storage.local.set(noteObject, () => {
    alert('Note saved!');
  });
}

// Set the dropdown value to the current site, load the saved data when popup is opened
getCurrentTabUrl((currentUrl) => {
  const optionValues = Array.from(siteList.options).map(
    (option) => option.value
  );
  siteList.value = optionValues.includes(currentUrl) ? currentUrl : ''; // Showing URL only if it is saved before
  console.log(currentUrl);
  console.log(siteList.value);
  loadData(currentUrl, (data) => {
    noteArea.value = data || '';
  });
  manageOpenLinkButtonState(currentUrl);
});

// Delete notes
document.getElementById('deleteNote').addEventListener('click', () => {
  let url = siteList.value;

  if (!url) {
    getCurrentTabUrl((currentUrl) => {
      deleteNote(currentUrl);
    });
  } else {
    deleteNote(url);
  }
});

function deleteNote(url) {
  chrome.storage.local.remove(url, () => {
    alert('Note deleted!');

    for (let i = 0; i < siteList.options.length; i++) {
      if (siteList.options[i].value === url) {
        siteList.remove(i);
        break;
      }
    }

    noteArea.value = '';
  });
}

// Export notes
document.getElementById('exportNotes').addEventListener('click', () => {
  chrome.storage.local.get(null, (data) => {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'notes_backup.json';
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  });
});

// Import notes
document.getElementById('importNotes').addEventListener('click', () => {
  fileInput.click();

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];

    if (file) {
      const reader = new FileReader();
      reader.readAsText(file, 'UTF-8');
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          chrome.storage.local.set(data, () => {
            alert('Notes imported successfully!');
          });
        } catch (error) {
          alert('Failed to import notes. Invalid file format.');
        }
      };
    }
  });
});
