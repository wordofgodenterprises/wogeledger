/* =========================================
   WOGE LEDGER
   WORD OF GOD ENTERPRISES
========================================= */


const STORAGE_KEY = "WOGE_LEDGER_DATA";


/* =========================================
   DEFAULT DATA
========================================= */

const defaultData = {

  accounts: [

    {
      id: createId(),

      name: "SBI",

      opening: 46000,

      expenses: []
    }

  ],

  selectedAccount: null,

  title: "EXPENSES"

};


let data = loadData();


if (!data.selectedAccount) {

  data.selectedAccount =
    data.accounts[0]?.id || null;

}


/* =========================================
   HELPERS
========================================= */

function createId() {

  if (window.crypto && crypto.randomUUID) {

    return crypto.randomUUID();

  }

  return Date.now().toString(36) +
         Math.random().toString(36).substring(2);

}


function money(value) {

  return "₹" +
    Number(value || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );

}


function today() {

  return new Date()
    .toISOString()
    .split("T")[0];

}


function escapeHTML(text) {

  return String(text)

    .replaceAll("&","&amp;")

    .replaceAll("<","&lt;")

    .replaceAll(">","&gt;")

    .replaceAll('"',"&quot;")

    .replaceAll("'","&#039;");

}


function formatDate(date) {

  if (!date) return "";

  const parts = date.split("-");

  return parts[2] +
         "/" +
         parts[1] +
         "/" +
         parts[0].substring(2);

}


/* =========================================
   STORAGE
========================================= */

function loadData() {

  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (saved) {

      return JSON.parse(saved);

    }

  }

  catch(error) {

    console.error(error);

  }


  return JSON.parse(
    JSON.stringify(defaultData)
  );

}


function saveData() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );

}


/* =========================================
   CURRENT ACCOUNT
========================================= */

function currentAccount() {

  return data.accounts.find(
    account =>
      account.id === data.selectedAccount
  ) || data.accounts[0];

}


/* =========================================
   ACCOUNT SELECT
========================================= */

function renderAccountSelect() {

  const select =
    document.getElementById("accountSelect");


  select.innerHTML =
    data.accounts.map(account => {

      return `
        <option value="${account.id}">
          ${escapeHTML(account.name)}
        </option>
      `;

    }).join("");


  if (currentAccount()) {

    select.value =
      currentAccount().id;

  }

}


/* =========================================
   FILTER EXPENSES
========================================= */

function getExpenses() {

  const account =
    currentAccount();


  if (!account) return [];


  let expenses =
    [...account.expenses];


  expenses.sort(
    (a,b) =>
      (a.date + a.created)
        .localeCompare(
          b.date + b.created
        )
  );


  const from =
    document.getElementById(
      "fromDate"
    ).value;


  const to =
    document.getElementById(
      "toDate"
    ).value;


  if (from) {

    expenses =
      expenses.filter(
        expense =>
          expense.date >= from
      );

  }


  if (to) {

    expenses =
      expenses.filter(
        expense =>
          expense.date <= to
      );

  }


  return expenses;

}


/* =========================================
   RENDER LEDGER
========================================= */

function render() {

  renderAccountSelect();


  const account =
    currentAccount();


  if (!account) return;


  const expenses =
    getExpenses();


  let runningBalance =
    Number(account.opening) || 0;


  let totalExpenses = 0;


  const body =
    document.getElementById(
      "ledgerBody"
    );


  body.innerHTML = "";


  expenses.forEach(expense => {

    totalExpenses +=
      Number(expense.amount);


    runningBalance -=
      Number(expense.amount);


    const row =
      document.createElement("tr");


    row.innerHTML = `

      <td>
        ${formatDate(expense.date)}
      </td>

      <td>
        ${escapeHTML(
          expense.description
        )}
      </td>

      <td class="right">
        ${money(expense.amount)}
      </td>

      <td class="right">
        ${money(runningBalance)}
      </td>

      <td class="actions no-print">

        <button
          class="edit"
          onclick="editExpense('${expense.id}')">
          Edit
        </button>

        <button
          class="delete"
          onclick="deleteExpense('${expense.id}')">
          Delete
        </button>

      </td>

    `;


    body.appendChild(row);

  });


  const currentBalance =
    Number(account.opening) -
    totalExpenses;


  document.getElementById(
    "openingBalance"
  ).textContent =
    money(account.opening);


  document.getElementById(
    "totalExpenses"
  ).textContent =
    money(totalExpenses);


  document.getElementById(
    "currentBalance"
  ).textContent =
    money(currentBalance);


  document.getElementById(
    "entryCount"
  ).textContent =
    expenses.length;


  document.getElementById(
    "footerTotal"
  ).textContent =
    money(totalExpenses);


  document.getElementById(
    "footerBalance"
  ).textContent =
    money(currentBalance);


  document.getElementById(
    "printOpening"
  ).textContent =
    money(account.opening);


  const title =
    document.getElementById(
      "statementTitle"
    ).value || "EXPENSES";


  document.getElementById(
    "printTitle"
  ).textContent =
    title;


  const from =
    document.getElementById(
      "fromDate"
    ).value;


  const to =
    document.getElementById(
      "toDate"
    ).value;


  let meta =
    account.name +
    " • " +
    expenses.length +
    " entries";


  if (from || to) {

    meta +=
      " • " +
      (from || "Start") +
      " to " +
      (to || "Present");

  }


  document.getElementById(
    "printMeta"
  ).textContent =
    meta;


  document.getElementById(
    "emptyState"
  ).style.display =
    expenses.length
      ? "none"
      : "block";


  data.title = title;

  saveData();

}


/* =========================================
   CHANGE ACCOUNT
========================================= */

function changeAccount() {

  data.selectedAccount =
    document.getElementById(
      "accountSelect"
    ).value;


  saveData();

  render();

}


/* =========================================
   EXPENSE MODAL
========================================= */

function openExpense(id = null) {

  const modal =
    document.getElementById(
      "expenseModal"
    );


  document.getElementById(
    "editingId"
  ).value =
    id || "";


  if (id) {

    const account =
      currentAccount();


    const expense =
      account.expenses.find(
        item =>
          item.id === id
      );


    if (!expense) return;


    document.getElementById(
      "expenseModalTitle"
    ).textContent =
      "Edit Expense";


    document.getElementById(
      "expenseDate"
    ).value =
      expense.date;


    document.getElementById(
      "expenseAmount"
    ).value =
      expense.amount;


    document.getElementById(
      "expenseDescription"
    ).value =
      expense.description;

  }

  else {

    document.getElementById(
      "expenseModalTitle"
    ).textContent =
      "New Expense";


    document.getElementById(
      "expenseDate"
    ).value =
      today();


    document.getElementById(
      "expenseAmount"
    ).value =
      "";


    document.getElementById(
      "expenseDescription"
    ).value =
      "";

  }


  modal.classList.add("show");


  setTimeout(() => {

    document.getElementById(
      "expenseDescription"
    ).focus();

  },100);

}


function closeExpense() {

  document.getElementById(
    "expenseModal"
  ).classList.remove("show");

}


/* =========================================
   SAVE EXPENSE
========================================= */

function saveExpense() {

  const account =
    currentAccount();


  if (!account) {

    alert("Please create a bank account first.");

    return;

  }


  const id =
    document.getElementById(
      "editingId"
    ).value;


  const date =
    document.getElementById(
      "expenseDate"
    ).value;


  const amount =
    Number(
      document.getElementById(
        "expenseAmount"
      ).value
    );


  const description =
    document.getElementById(
      "expenseDescription"
    ).value.trim();


  if (!date) {

    alert("Please select a date.");

    return;

  }


  if (!(amount > 0)) {

    alert("Please enter a valid amount.");

    return;

  }


  if (!description) {

    alert("Please enter expense description.");

    return;

  }


  if (id) {

    const index =
      account.expenses.findIndex(
        expense =>
          expense.id === id
      );


    if (index !== -1) {

      account.expenses[index] = {

        ...account.expenses[index],

        date,

        amount,

        description

      };

    }

  }

  else {

    account.expenses.push({

      id: createId(),

      date,

      amount,

      description,

      created: Date.now()

    });

  }


  saveData();

  closeExpense();

  render();

}


/* =========================================
   EDIT EXPENSE
========================================= */

function editExpense(id) {

  openExpense(id);

}


/* =========================================
   DELETE EXPENSE
========================================= */

function deleteExpense(id) {

  if (!confirm(
    "Are you sure you want to delete this expense?"
  )) {

    return;

  }


  const account =
    currentAccount();


  account.expenses =
    account.expenses.filter(
      expense =>
        expense.id !== id
    );


  saveData();

  render();

}


/* =========================================
   ACCOUNT MODAL
========================================= */

function openAccount() {

  document.getElementById(
    "accountName"
  ).value = "";


  document.getElementById(
    "accountOpening"
  ).value = "";


  document.getElementById(
    "accountModal"
  ).classList.add("show");

}


function closeAccount() {

  document.getElementById(
    "accountModal"
  ).classList.remove("show");

}


/* =========================================
   SAVE ACCOUNT
========================================= */

function saveAccount() {

  const name =
    document.getElementById(
      "accountName"
    ).value.trim();


  const opening =
    Number(
      document.getElementById(
        "accountOpening"
      ).value
    );


  if (!name) {

    alert("Please enter account name.");

    return;

  }


  if (opening < 0) {

    alert("Opening balance cannot be negative.");

    return;

  }


  const account = {

    id: createId(),

    name,

    opening,

    expenses: []

  };


  data.accounts.push(account);

  data.selectedAccount =
    account.id;


  saveData();

  closeAccount();

  renderAccounts();

  render();

}


/* =========================================
   ACCOUNTS PAGE
========================================= */

function renderAccounts() {

  const container =
    document.getElementById(
      "accountList"
    );


  container.innerHTML =
    data.accounts.map(account => {

      const total =
        account.expenses.reduce(
          (sum, expense) =>
            sum +
            Number(expense.amount),
          0
        );


      const balance =
        Number(account.opening) -
        total;


      return `

        <div class="account-card">

          <h3>
            ${escapeHTML(account.name)}
          </h3>

          <p>
            Opening Balance
          </p>

          <div class="account-balance">
            ${money(account.opening)}
          </div>

          <p>
            ${account.expenses.length}
            expense entries
            •
            ${money(total)}
            spent
          </p>

          <p>
            Current Balance:
            <strong>
              ${money(balance)}
            </strong>
          </p>

          <div class="account-buttons">

            <button
              class="btn outline"
              onclick="useAccount('${account.id}')">
              Use Account
            </button>

            ${
              data.accounts.length > 1
              ?
              `
                <button
                  class="btn danger"
                  onclick="removeAccount('${account.id}')">
                  Delete
                </button>
              `
              :
              ""
            }

          </div>

        </div>

      `;

    }).join("");

}


function useAccount(id) {

  data.selectedAccount = id;

  saveData();

  render();

  showPage(
    "ledger",
    document.querySelector(
      ".nav"
    )
  );

}


function removeAccount(id) {

  if (data.accounts.length <= 1) {

    alert(
      "You must keep at least one account."
    );

    return;

  }


  if (!confirm(
    "Delete this account and all its expenses?"
  )) {

    return;

  }


  data.accounts =
    data.accounts.filter(
      account =>
        account.id !== id
    );


  data.selectedAccount =
    data.accounts[0].id;


  saveData();

  renderAccounts();

  render();

}


/* =========================================
   PAGE NAVIGATION
========================================= */

function showPage(page, button) {

  document.getElementById(
    "ledgerPage"
  ).classList.add("hidden");


  document.getElementById(
    "accountsPage"
  ).classList.add("hidden");


  document.getElementById(
    "backupPage"
  ).classList.add("hidden");


  document.getElementById(
    page + "Page"
  ).classList.remove("hidden");


  document.querySelectorAll(
    ".nav"
  ).forEach(nav => {

    nav.classList.remove("active");

  });


  if (button) {

    button.classList.add("active");

  }


  const titles = {

    ledger: "Expense Ledger",

    accounts: "Bank Accounts",

    backup: "Backup & Data"

  };


  document.getElementById(
    "pageTitle"
  ).textContent =
    titles[page];


  if (page === "accounts") {

    renderAccounts();

  }

}


/* =========================================
   EXPORT BACKUP
========================================= */

function exportBackup() {

  const blob =
    new Blob(
      [
        JSON.stringify(
          data,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = url;


  link.download =
    "WOGE-Ledger-Backup-" +
    today() +
    ".json";


  link.click();


  URL.revokeObjectURL(url);

}


/* =========================================
   IMPORT BACKUP
========================================= */

async function importBackup(event) {

  const file =
    event.target.files[0];


  if (!file) return;


  try {

    const text =
      await file.text();


    const imported =
      JSON.parse(text);


    if (!Array.isArray(
      imported.accounts
    )) {

      throw new Error(
        "Invalid backup"
      );

    }


    data = imported;


    if (!data.selectedAccount) {

      data.selectedAccount =
        data.accounts[0]?.id;

    }


    saveData();

    render();

    renderAccounts();


    alert(
      "Backup imported successfully."
    );

  }

  catch(error) {

    alert(
      "This backup file is not valid."
    );

  }


  event.target.value = "";

}


/* =========================================
   CLEAR DATA
========================================= */

function clearAllData() {

  if (!confirm(
    "WARNING!\n\n" +
    "This will permanently delete all " +
    "accounts and expenses from this browser.\n\n" +
    "Continue?"
  )) {

    return;

  }


  data =
    JSON.parse(
      JSON.stringify(
        defaultData
      )
    );


  data.selectedAccount =
    data.accounts[0].id;


  saveData();

  render();

  renderAccounts();

}


/* =========================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================= */

document
  .getElementById("expenseModal")
  .addEventListener(
    "click",
    function(event) {

      if (
        event.target === this
      ) {

        closeExpense();

      }

    }
  );


document
  .getElementById("accountModal")
  .addEventListener(
    "click",
    function(event) {

      if (
        event.target === this
      ) {

        closeAccount();

      }

    }
  );


/* =========================================
   KEYBOARD ESC
========================================= */

document.addEventListener(
  "keydown",
  event => {

    if (event.key === "Escape") {

      closeExpense();

      closeAccount();

    }

  }
);


/* =========================================
   INITIALIZE
========================================= */

document.getElementById(
  "statementTitle"
).value =
  data.title || "EXPENSES";


render();

renderAccounts();
