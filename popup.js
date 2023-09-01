// DOM Element References
const siteList = document.getElementById('siteList');
const noteArea = document.getElementById('noteArea');
const openLinkButton = document.getElementById('openLink');

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
  const url = siteList.value;
  chrome.storage.local.get(url, (result) => {
    noteArea.value = result[url] || '';
  });
  // Disable open link button if the link is same as current URL or if the URL is new
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    if (!url || url == currentUrl) {
      openLinkButton.setAttribute('disabled', 'disabled');
    } else {
      openLinkButton.removeAttribute('disabled');
    }
  });
});

// Open URL in new tab when clicked
document.getElementById('openLink').addEventListener('click', function () {
  const selectedURL = document.getElementById('siteList').value;

  // Check if a URL is selected from the dropdown
  if (selectedURL) {
    chrome.tabs.create({ url: selectedURL }); // This will open the URL in a new tab
  }
});

document.getElementById('saveNote').addEventListener('click', () => {
  let url = siteList.value;
  if (!url || url === undefined) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      url = tabs[0].url;
      saveNote(url);
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

// Set the dropdown value to the current site when popup is opened
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0].url;

  // Show the URL if it is already saved
  for (let i = 0; i < siteList.options.length; i++) {
    if (siteList.options[i].value === url) {
      siteList.value = url;
      chrome.storage.local.get(url, (result) => {
        noteArea.value = result[url] || '';
      });
      openLinkButton.setAttribute('disabled', 'disabled'); // Button disabled as the URL selected is same as current URL
      break;
    }
  }
});

// Add an event listener for the delete button
document.getElementById('deleteNote').addEventListener('click', () => {
  let url = siteList.value;
  if (!url) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      url = tabs[0].url;
      deleteNote(url);
    });
  } else {
    deleteNote(url);
  }
});

function deleteNote(url) {
  chrome.storage.local.remove(url, () => {
    alert('Note deleted!');

    // Remove the URL from the dropdown list
    for (let i = 0; i < siteList.options.length; i++) {
      if (siteList.options[i].value === url) {
        siteList.remove(i);
        break;
      }
    }

    // Clear the textarea
    noteArea.value = '';
  });
}

document.getElementById('exportNotes').addEventListener('click', () => {
  chrome.storage.local.get(null, (data) => {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a link element to start download
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'notes_backup.json';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  });
});

document.getElementById('importNotes').addEventListener('click', () => {
  const fileInput = document.getElementById('importFile');
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
