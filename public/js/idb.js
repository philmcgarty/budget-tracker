// indexedDB file - MODIFIED MODULE 18 CODE

// db connection variable
let db;

// establish connection to db called budget_tracker, v1
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function (event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called `new_budget_entry`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_budget_entry', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function (event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run uploadBudget() function to send all local db data to api
    if (navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function (event) {
    // log error here
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new budget item and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_budget_entry'], 'readwrite');

    // access the object store for `new_budget_entry`
    const budgetObjectStore = transaction.objectStore('new_budget_entry');

    // add record to your store with add method
    budgetObjectStore.add(record);
}

function uploadBudget() {
    // open a transaction on your db
    const transaction = db.transaction(['new_budget_entry'], 'readwrite');

    // access your object store
    const budgetObjectStore = transaction.objectStore('new_budget_entry');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['new_budget_entry'], 'readwrite');
                    // access the new_budget_entry object store
                    const budgetObjectStore = transaction.objectStore('new_budget_entry');
                    // clear all items in your store
                    budgetObjectStore.clear();

                    alert('All offline budget submissions have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadBudget);