/* =========================================================
   WOGE LEDGER
   WORD OF GOD ENTERPRISES

   COMPLETE APP.JS
   Version 3.0

   FEATURES
   ---------------------------------------------------------
   • Multiple bank accounts
   • Opening balance
   • Daily ledgers
   • Credit transactions
   • Expense transactions
   • Automatic closing balance
   • Automatic next-day opening balance
   • Continuous transaction entry
   • Edit / delete transactions
   • Monthly summary
   • Date / month filtering
   • Professional gold & black printing
   • Backup / restore
   • Existing WOGE_LEDGER_V2 data compatible
========================================================= */


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "WOGE_LEDGER_V2";


/* =========================================================
   ID
========================================================= */

function createId() {

  if (
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
  );
}


/* =========================================================
   DEFAULT DATA
========================================================= */

const defaultData = {

  accounts: [
    {
      id: createId(),
      name: "SBI",
      opening: 46000,
      ledgers: []
    }
  ],

  selectedAccount: null

};


/* =========================================================
   LOAD DATA
========================================================= */

function loadData() {

  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (saved) {

      const parsed =
        JSON.parse(saved);

      if (
        parsed &&
        Array.isArray(parsed.accounts)
      ) {

        return normalizeData(parsed);

      }

    }

  }
  catch (error) {

    console.error(
      "WOGE Ledger load error:",
      error
    );

  }

  return normalizeData(
    JSON.parse(
      JSON.stringify(defaultData)
    )
  );
}


/* =========================================================
   NORMALIZE DATA
========================================================= */

function normalizeData(input) {

  const result =
    input || {};

  if (!Array.isArray(result.accounts)) {
    result.accounts = [];
  }

  result.accounts =
    result.accounts.map(account => {

      if (!account.id) {
        account.id = createId();
      }

      if (!account.name) {
        account.name = "Bank Account";
      }

      account.opening =
        Number(account.opening) || 0;

      if (!Array.isArray(account.ledgers)) {
        account.ledgers = [];
      }

      account.ledgers =
        account.ledgers.map(ledger => {

          if (!ledger.id) {
            ledger.id = createId();
          }

          if (!ledger.date) {
            ledger.date = today();
          }

          ledger.opening =
            Number(ledger.opening) || 0;

          if (!Array.isArray(ledger.transactions)) {
            ledger.transactions = [];
          }

          ledger.transactions =
            ledger.transactions.map(transaction => {

              if (!transaction.id) {
                transaction.id = createId();
              }

              if (
                transaction.type !== "credit" &&
                transaction.type !== "expense"
              ) {
                transaction.type = "expense";
              }

              transaction.amount =
                Number(transaction.amount) || 0;

              transaction.description =
                transaction.description || "";

              return transaction;

            });

          return ledger;

        });

      return account;

    });

  if (!result.selectedAccount) {

    result.selectedAccount =
      result.accounts[0]?.id || null;

  }

  return result;
}


/* =========================================================
   SAVE DATA
========================================================= */

let data = loadData();

function saveData() {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );

  }
  catch (error) {

    console.error(
      "WOGE Ledger save error:",
      error
    );

    alert(
      "Could not save data in this browser."
    );

  }

  /* Cloud sync is automatic when Supabase is configured. */
  scheduleCloudSave();

}


/* =========================================================
   BASIC HELPERS
========================================================= */

function money(value) {

  return (
    "₹" +
    Number(value || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )
  );

}


function today() {

  const d = new Date();

  const year =
    d.getFullYear();

  const month =
    String(
      d.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      d.getDate()
    ).padStart(2, "0");

  return (
    year +
    "-" +
    month +
    "-" +
    day
  );

}


function currentMonth() {

  return today().substring(0, 7);

}


function escapeHTML(text) {

  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function formatDate(date) {

  if (!date) return "";

  const parts =
    date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  return (
    parts[2] +
    "/" +
    parts[1] +
    "/" +
    parts[0]
  );

}


function formatMonth(month) {

  if (!month) return "";

  const parts =
    month.split("-");

  if (parts.length !== 2) {
    return month;
  }

  const names = [

    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"

  ];

  const index =
    Number(parts[1]) - 1;

  return (
    (names[index] || "") +
    " " +
    parts[0]
  );

}


/* =========================================================
   ACCOUNT
========================================================= */

function currentAccount() {

  return (
    data.accounts.find(
      account =>
        account.id ===
        data.selectedAccount
    ) ||
    data.accounts[0] ||
    null
  );

}


function findAccount(accountId) {

  return data.accounts.find(
    account =>
      account.id === accountId
  ) || null;

}


function findLedger(account, ledgerId) {

  if (!account) return null;

  return (
    account.ledgers.find(
      ledger =>
        ledger.id === ledgerId
    ) || null
  );

}


/* =========================================================
   ACCOUNT SELECTS
========================================================= */

function renderAllAccountSelects() {

  const ids = [

    "dashboardAccount",
    "dailyAccount",
    "monthlyAccount",
    "ledgerAccount"

  ];

  ids.forEach(id => {

    const select =
      document.getElementById(id);

    if (!select) return;

    const oldValue =
      select.value;

    select.innerHTML = "";

    data.accounts.forEach(account => {

      const option =
        document.createElement("option");

      option.value =
        account.id;

      option.textContent =
        account.name;

      select.appendChild(option);

    });

    const account =
      currentAccount();

    if (account) {

      select.value =
        data.accounts.some(
          a => a.id === oldValue
        )
          ? oldValue
          : account.id;

    }

  });

}


/* =========================================================
   ACCOUNT CHANGE
========================================================= */

function changeAccountFromDashboard() {

  const select =
    document.getElementById(
      "dashboardAccount"
    );

  if (!select) return;

  data.selectedAccount =
    select.value;

  saveData();

  renderAll();

}


function syncAccountSelects() {

  renderAllAccountSelects();

}


/* =========================================================
   LEDGER SORTING
========================================================= */

function sortLedgers(account) {

  if (!account) return [];

  return [
    ...(account.ledgers || [])
  ].sort(
    (a, b) =>
      a.date.localeCompare(b.date)
  );

}


/* =========================================================
   LEDGER TOTALS
========================================================= */

function ledgerTotals(ledger) {

  let credits = 0;
  let expenses = 0;

  (
    ledger?.transactions || []
  ).forEach(transaction => {

    const amount =
      Number(transaction.amount) || 0;

    if (
      transaction.type === "credit"
    ) {

      credits += amount;

    }
    else {

      expenses += amount;

    }

  });

  const opening =
    Number(ledger?.opening) || 0;

  const closing =
    opening +
    credits -
    expenses;

  return {

    opening,
    credits,
    expenses,
    closing

  };

}


/* =========================================================
   RECALCULATE OPENINGS
========================================================= */

function recalculateOpenings(account) {

  if (!account) return;

  const ledgers =
    sortLedgers(account);

  let runningBalance =
    Number(account.opening) || 0;

  ledgers.forEach(ledger => {

    ledger.opening =
      runningBalance;

    const totals =
      ledgerTotals(ledger);

    runningBalance =
      totals.closing;

  });

}


/* =========================================================
   MONTH LEDGERS
========================================================= */

function getMonthLedgers(
  account,
  month
) {

  if (!account) return [];

  return sortLedgers(account)
    .filter(
      ledger =>
        ledger.date.startsWith(month)
    );

}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

  renderAllAccountSelects();

  const account =
    currentAccount();

  if (!account) return;

  const monthInput =
    document.getElementById(
      "dashboardMonth"
    );

  const month =
    monthInput?.value ||
    currentMonth();

  if (monthInput) {
    monthInput.value = month;
  }

  ensureDailyDateFilter();

  recalculateOpenings(account);

  let ledgers =
    getMonthLedgers(
      account,
      month
    );

  const dateFilter =
    document.getElementById(
      "wogeDailyDateFilter"
    )?.value || "";

  if (dateFilter) {
    ledgers = ledgers.filter(
      ledger => ledger.date === dateFilter
    );
  }

  let opening =
    Number(account.opening) || 0;

  if (ledgers.length) {

    opening =
      Number(
        ledgers[0].opening
      );

  }

  let credits = 0;
  let expenses = 0;

  ledgers.forEach(ledger => {

    const totals =
      ledgerTotals(ledger);

    credits += totals.credits;
    expenses += totals.expenses;

  });

  let closing =
    opening +
    credits -
    expenses;

  if (ledgers.length) {

    closing =
      ledgerTotals(
        ledgers[
          ledgers.length - 1
        ]
      ).closing;

  }

  setText(
    "dashboardOpening",
    money(opening)
  );

  setText(
    "dashboardCredits",
    money(credits)
  );

  setText(
    "dashboardExpenses",
    money(expenses)
  );

  setText(
    "dashboardBalance",
    money(closing)
  );

  setText(
    "dashboardMeta",
    account.name +
    " • " +
    formatMonth(month)
  );

  const body =
    document.getElementById(
      "dashboardLedgerBody"
    );

  if (!body) return;

  body.innerHTML = "";

  ledgers.forEach(ledger => {

    const totals =
      ledgerTotals(ledger);

    const row =
      document.createElement("tr");

    row.innerHTML = `

      <td>
        ${formatDate(ledger.date)}
      </td>

      <td>
        ${money(totals.opening)}
      </td>

      <td class="right">
        ${money(totals.credits)}
      </td>

      <td class="right">
        ${money(totals.expenses)}
      </td>

      <td class="right">
        ${money(totals.closing)}
      </td>

      <td>

        <button
          class="edit"
          onclick="openLedgerDetails('${ledger.id}')"
        >
          Open
        </button>

      </td>

    `;

    body.appendChild(row);

  });

  const empty =
    document.getElementById(
      "dashboardEmpty"
    );

  if (empty) {

    empty.style.display =
      ledgers.length
        ? "none"
        : "block";

  }

}


/* =========================================================
   DAILY LEDGER MODAL
========================================================= */

function openDailyLedger(
  selectedDate = null
) {

  renderAllAccountSelects();

  const account =
    currentAccount();

  if (!account) {

    alert(
      "Please create a bank account first."
    );

    return;

  }

  const modal =
    document.getElementById(
      "dailyModal"
    );

  const dateInput =
    document.getElementById(
      "ledgerDate"
    );

  const accountInput =
    document.getElementById(
      "ledgerAccount"
    );

  if (!modal ||
      !dateInput ||
      !accountInput) {

    alert(
      "Daily ledger form was not found."
    );

    return;

  }

  dateInput.value =
    selectedDate || today();

  accountInput.value =
    account.id;

  updateLedgerOpeningPreview();

  modal.classList.add("show");

  modal.style.zIndex = "5000";

}


function closeDailyLedger() {

  const modal =
    document.getElementById(
      "dailyModal"
    );

  if (modal) {

    modal.classList.remove("show");

  }

}


/* =========================================================
   OPENING BALANCE PREVIEW
========================================================= */

function updateLedgerOpeningPreview() {

  const accountInput =
    document.getElementById(
      "ledgerAccount"
    );

  const dateInput =
    document.getElementById(
      "ledgerDate"
    );

  const openingInput =
    document.getElementById(
      "ledgerOpening"
    );

  if (
    !accountInput ||
    !dateInput ||
    !openingInput
  ) {
    return;
  }

  const account =
    findAccount(
      accountInput.value
    );

  const date =
    dateInput.value;

  if (!account || !date) return;

  recalculateOpenings(account);

  const existing =
    account.ledgers.find(
      ledger =>
        ledger.date === date
    );

  if (existing) {

    openingInput.value =
      existing.opening;

    return;

  }

  const earlier =
    sortLedgers(account)
      .filter(
        ledger =>
          ledger.date < date
      );

  let opening =
    Number(account.opening) || 0;

  if (earlier.length) {

    const previous =
      earlier[
        earlier.length - 1
      ];

    opening =
      ledgerTotals(
        previous
      ).closing;

  }

  openingInput.value =
    opening;

}


/* =========================================================
   SAVE DAILY LEDGER
========================================================= */

function saveDailyLedger() {

  const accountId =
    document.getElementById(
      "ledgerAccount"
    )?.value;

  const date =
    document.getElementById(
      "ledgerDate"
    )?.value;

  const opening =
    Number(
      document.getElementById(
        "ledgerOpening"
      )?.value
    );

  if (!date) {

    alert(
      "Please select a date."
    );

    return;

  }

  if (
    !Number.isFinite(opening) ||
    opening < 0
  ) {

    alert(
      "Opening balance cannot be negative."
    );

    return;

  }

  const account =
    findAccount(accountId);

  if (!account) {

    alert(
      "Account not found."
    );

    return;

  }

  if (!Array.isArray(account.ledgers)) {
    account.ledgers = [];
  }

  const existing =
    account.ledgers.find(
      ledger =>
        ledger.date === date
    );

  if (existing) {

    closeDailyLedger();

    data.selectedAccount =
      account.id;

    saveData();

    renderAll();

    openLedgerDetails(
      existing.id
    );

    return;

  }

  const ledger = {

    id: createId(),

    date,

    opening,

    transactions: [],

    created: Date.now()

  };

  account.ledgers.push(ledger);

  data.selectedAccount =
    account.id;

  recalculateOpenings(account);

  saveData();

  closeDailyLedger();

  renderAll();

  openLedgerDetails(
    ledger.id
  );

}


/* =========================================================
   DAILY LEDGER LIST
========================================================= */

function renderDailyLedgers() {

  renderAllAccountSelects();

  const select =
    document.getElementById(
      "dailyAccount"
    );

  const monthInput =
    document.getElementById(
      "dailyMonth"
    );

  const account =
    findAccount(
      select?.value
    ) ||
    currentAccount();

  if (!account) return;

  data.selectedAccount =
    account.id;

  const month =
    monthInput?.value ||
    currentMonth();

  if (monthInput) {
    monthInput.value = month;
  }

  recalculateOpenings(account);

  const ledgers =
    getMonthLedgers(
      account,
      month
    );

  const container =
    document.getElementById(
      "dailyLedgerList"
    );

  if (!container) return;

  container.innerHTML = "";

  ledgers
    .slice()
    .reverse()
    .forEach(ledger => {

      const totals =
        ledgerTotals(ledger);

      const card =
        document.createElement("div");

      card.className =
        "account-card";

      card.innerHTML = `

        <div class="eyebrow">
          DAILY LEDGER
        </div>

        <h3>
          ${formatDate(ledger.date)}
        </h3>

        <p>
          ${escapeHTML(account.name)}
        </p>

        <p>
          Opening Balance
        </p>

        <div class="account-balance">
          ${money(totals.opening)}
        </div>

        <p>
          Credits:
          <strong>
            ${money(totals.credits)}
          </strong>
        </p>

        <p>
          Expenses:
          <strong>
            ${money(totals.expenses)}
          </strong>
        </p>

        <p>
          Closing Balance:
        </p>

        <div class="account-balance">
          ${money(totals.closing)}
        </div>

        <p>
          ${ledger.transactions.length}
          transactions
        </p>

        <div class="account-buttons">

          <button
            class="btn gold"
            onclick="openLedgerDetails('${ledger.id}')"
          >
            Open Ledger
          </button>

          <button
            class="btn danger"
            onclick="deleteDailyLedger('${ledger.id}')"
          >
            Delete
          </button>

        </div>

      `;

      container.appendChild(card);

    });

  const empty =
    document.getElementById(
      "dailyEmpty"
    );

  if (empty) {

    empty.style.display =
      ledgers.length
        ? "none"
        : "block";

  }

}


/* =========================================================
   OPEN LEDGER DETAILS
========================================================= */

function openLedgerDetails(
  ledgerId
) {

  const account =
    currentAccount();

  if (!account) return;

  recalculateOpenings(account);

  const ledger =
    findLedger(
      account,
      ledgerId
    );

  if (!ledger) {

    alert(
      "Ledger not found."
    );

    return;

  }

  let viewer =
    document.getElementById(
      "ledgerViewer"
    );

  if (!viewer) {

    viewer =
      document.createElement("div");

    viewer.id =
      "ledgerViewer";

    viewer.className =
      "modal";

    document.body.appendChild(
      viewer
    );

  }

  viewer.style.zIndex =
    "4000";

  const totals =
    ledgerTotals(ledger);

  let running =
    totals.opening;

  let rows = "";

  (
    ledger.transactions || []
  ).forEach(transaction => {

    const amount =
      Number(transaction.amount) || 0;

    if (
      transaction.type === "credit"
    ) {

      running += amount;

    }
    else {

      running -= amount;

    }

    const isCredit =
      transaction.type === "credit";

    rows += `

      <tr>

        <td>

          <span class="
            ${isCredit
              ? "transaction-credit"
              : "transaction-expense"}
          ">

            ${isCredit
              ? "CREDIT"
              : "EXPENSE"}

          </span>

        </td>

        <td>
          ${escapeHTML(
            transaction.description
          )}
        </td>

        <td class="right">

          ${isCredit
            ? "+"
            : "-"
          }${money(amount)}

        </td>

        <td class="right">
          ${money(running)}
        </td>

        <td class="actions no-print">

          <button
            class="edit"
            onclick="
              editTransaction(
                '${ledger.id}',
                '${transaction.id}'
              )
            "
          >
            Edit
          </button>

          <button
            class="delete"
            onclick="
              deleteTransaction(
                '${ledger.id}',
                '${transaction.id}'
              )
            "
          >
            Delete
          </button>

        </td>

      </tr>

    `;

  });

  if (!rows) {

    rows = `

      <tr>

        <td
          colspan="5"
          style="
            text-align:center;
            padding:40px;
            color:#777;
          "
        >
          No transactions yet.
        </td>

      </tr>

    `;

  }

  viewer.innerHTML = `

    <div
      class="modal-box"
      style="
        width:min(1100px,96vw);
        max-height:94vh;
        overflow:auto;
      "
    >

      <div class="modal-header">

        <div>

          <div class="eyebrow">
            WORD OF GOD ENTERPRISES
          </div>

          <h2>
            ${escapeHTML(account.name)}
            — Daily Ledger
          </h2>

          <div
            style="
              color:#aaa394;
              margin-top:6px;
              font-size:13px;
            "
          >
            ${formatDate(ledger.date)}
          </div>

        </div>

        <button
          class="close"
          onclick="closeLedgerViewer()"
        >
          ×
        </button>

      </div>


      <!-- SUMMARY -->

      <div class="cards">

        <div class="card">

          <div class="card-label">
            OPENING BALANCE
          </div>

          <div class="card-value">
            ${money(totals.opening)}
          </div>

        </div>


        <div class="card">

          <div class="card-label">
            TOTAL CREDITS
          </div>

          <div class="card-value">
            ${money(totals.credits)}
          </div>

        </div>


        <div class="card">

          <div class="card-label">
            TOTAL EXPENSES
          </div>

          <div class="card-value">
            ${money(totals.expenses)}
          </div>

        </div>


        <div class="card highlight">

          <div class="card-label">
            CLOSING BALANCE
          </div>

          <div class="card-value">
            ${money(totals.closing)}
          </div>

        </div>

      </div>


      <!-- TRANSACTIONS -->

      <div
        class="ledger"
        style="margin-top:20px;"
      >

        <div class="ledger-header">

          <div>

            <div class="print-brand">
              WORD OF GOD ENTERPRISES
            </div>

            <h2>
              DAILY LEDGER —
              ${formatDate(ledger.date)}
            </h2>

          </div>

          <button
            class="btn gold no-print"
            onclick="
              openTransaction(
                '${ledger.id}'
              )
            "
          >
            + Add Transaction
          </button>

        </div>


        <div class="table-container">

          <table>

            <thead>

              <tr>

                <th>
                  TYPE
                </th>

                <th>
                  DESCRIPTION
                </th>

                <th class="right">
                  AMOUNT
                </th>

                <th class="right">
                  BALANCE AFTER
                </th>

                <th class="actions no-print">
                  ACTION
                </th>

              </tr>

            </thead>

            <tbody>

              ${rows}

            </tbody>

            <tfoot>

              <tr>

                <td colspan="2">
                  CLOSING BALANCE
                </td>

                <td></td>

                <td class="right">
                  ${money(totals.closing)}
                </td>

                <td class="no-print"></td>

              </tr>

            </tfoot>

          </table>

        </div>

      </div>


      <div
        class="modal-buttons no-print"
      >

        <button
          class="btn outline"
          onclick="
            printDailyLedger(
              '${ledger.id}'
            )
          "
        >
          🖨 Print / PDF
        </button>

        <button
          class="btn gold"
          onclick="
            openTransaction(
              '${ledger.id}'
            )
          "
        >
          + Add Transaction
        </button>

      </div>

    </div>

  `;

  viewer.classList.add("show");

}


/* =========================================================
   CLOSE LEDGER VIEWER
========================================================= */

function closeLedgerViewer() {

  const viewer =
    document.getElementById(
      "ledgerViewer"
    );

  if (viewer) {

    viewer.classList.remove(
      "show"
    );

  }

}


/* =========================================================
   TRANSACTION MODAL
========================================================= */

function openTransaction(
  ledgerId,
  transactionId = null
) {

  const account =
    currentAccount();

  const ledger =
    findLedger(
      account,
      ledgerId
    );

  if (!ledger) {

    alert(
      "Ledger not found."
    );

    return;

  }

  const modal =
    document.getElementById(
      "transactionModal"
    );

  if (!modal) {

    alert(
      "Transaction window was not found."
    );

    return;

  }

  const ledgerIdInput =
    document.getElementById(
      "transactionLedgerId"
    );

  const transactionIdInput =
    document.getElementById(
      "transactionId"
    );

  const type =
    document.getElementById(
      "transactionType"
    );

  const amount =
    document.getElementById(
      "transactionAmount"
    );

  const description =
    document.getElementById(
      "transactionDescription"
    );

  const title =
    document.getElementById(
      "transactionTitle"
    );

  if (ledgerIdInput) {
    ledgerIdInput.value =
      ledgerId;
  }

  if (transactionIdInput) {
    transactionIdInput.value =
      transactionId || "";
  }

  if (transactionId) {

    const transaction =
      (
        ledger.transactions || []
      ).find(
        item =>
          item.id ===
          transactionId
      );

    if (!transaction) return;

    if (title) {
      title.textContent =
        "Edit Transaction";
    }

    if (type) {
      type.value =
        transaction.type;
    }

    if (amount) {
      amount.value =
        transaction.amount;
    }

    if (description) {
      description.value =
        transaction.description;
    }

  }
  else {

    if (title) {
      title.textContent =
        "Add Transaction";
    }

    if (type) {
      type.value =
        "expense";
    }

    if (amount) {
      amount.value =
        "";
    }

    if (description) {
      description.value =
        "";
    }

  }

  /*
     IMPORTANT:
     Transaction modal is deliberately placed
     ABOVE the ledger viewer.
  */

  modal.style.zIndex =
    "99999";

  modal.classList.add(
    "show"
  );

  setTimeout(() => {

    if (description) {
      description.focus();
    }

  }, 100);

}


/* =========================================================
   CLOSE TRANSACTION
========================================================= */

function closeTransaction() {

  const modal =
    document.getElementById(
      "transactionModal"
    );

  if (!modal) return;

  modal.classList.remove(
    "show"
  );

  modal.style.zIndex = "";

}


/* =========================================================
   SAVE TRANSACTION
========================================================= */

function saveTransaction() {

  const account =
    currentAccount();

  if (!account) {

    alert(
      "Please select a bank account."
    );

    return;

  }

  const ledgerId =
    document.getElementById(
      "transactionLedgerId"
    )?.value;

  const transactionId =
    document.getElementById(
      "transactionId"
    )?.value;

  const type =
    document.getElementById(
      "transactionType"
    )?.value;

  const amount =
    Number(
      document.getElementById(
        "transactionAmount"
      )?.value
    );

  const description =
    document.getElementById(
      "transactionDescription"
    )?.value
      .trim();

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    alert(
      "Please enter a valid amount."
    );

    return;

  }

  if (!description) {

    alert(
      "Please enter a description."
    );

    return;

  }

  if (
    type !== "credit" &&
    type !== "expense"
  ) {

    alert(
      "Please select Credit or Expense."
    );

    return;

  }

  const ledger =
    findLedger(
      account,
      ledgerId
    );

  if (!ledger) {

    alert(
      "Ledger not found."
    );

    return;

  }

  if (!Array.isArray(ledger.transactions)) {
    ledger.transactions = [];
  }


  /* =======================================================
     EDIT
  ======================================================= */

  if (transactionId) {

    const index =
      ledger.transactions.findIndex(
        transaction =>
          transaction.id ===
          transactionId
      );

    if (index !== -1) {

      ledger.transactions[index] = {

        ...ledger.transactions[index],

        type,

        amount,

        description

      };

    }

  }


  /* =======================================================
     ADD
  ======================================================= */

  else {

    ledger.transactions.push({

      id: createId(),

      type,

      amount,

      description,

      created: Date.now()

    });

  }


  /* =======================================================
     SAVE
  ======================================================= */

  recalculateOpenings(
    account
  );

  saveData();


  /* =======================================================
     REFRESH LEDGER BEHIND MODAL
  ======================================================= */

  refreshOpenLedgerViewer(
    ledgerId
  );

  renderAll();


  /* =======================================================
     CONTINUOUS ENTRY
     
     DO NOT CLOSE TRANSACTION MODAL.
  ======================================================= */

  const transactionIdInput =
    document.getElementById(
      "transactionId"
    );

  const amountInput =
    document.getElementById(
      "transactionAmount"
    );

  const descriptionInput =
    document.getElementById(
      "transactionDescription"
    );

  const typeInput =
    document.getElementById(
      "transactionType"
    );

  const title =
    document.getElementById(
      "transactionTitle"
    );

  if (transactionIdInput) {
    transactionIdInput.value = "";
  }

  if (amountInput) {
    amountInput.value = "";
  }

  if (descriptionInput) {
    descriptionInput.value = "";
  }

  if (typeInput) {
    typeInput.value = "expense";
  }

  if (title) {
    title.textContent =
      "Add Transaction";
  }

  const modal =
    document.getElementById(
      "transactionModal"
    );

  if (modal) {

    modal.style.zIndex =
      "99999";

    modal.classList.add(
      "show"
    );

  }

  setTimeout(() => {

    if (descriptionInput) {
      descriptionInput.focus();
    }

  }, 100);

}


/* =========================================================
   REFRESH OPEN LEDGER
========================================================= */

function refreshOpenLedgerViewer(
  ledgerId
) {

  const viewer =
    document.getElementById(
      "ledgerViewer"
    );

  if (!viewer) return;

  if (
    !viewer.classList.contains(
      "show"
    )
  ) {
    return;
  }

  openLedgerDetails(
    ledgerId
  );

  /*
     Restore transaction modal
     ABOVE the newly-rendered viewer.
  */

  const transactionModal =
    document.getElementById(
      "transactionModal"
    );

  if (
    transactionModal &&
    transactionModal.classList.contains(
      "show"
    )
  ) {

    transactionModal.style.zIndex =
      "99999";

  }

}


/* =========================================================
   EDIT TRANSACTION
========================================================= */

function editTransaction(
  ledgerId,
  transactionId
) {

  openTransaction(
    ledgerId,
    transactionId
  );

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

function deleteTransaction(
  ledgerId,
  transactionId
) {

  const account =
    currentAccount();

  const ledger =
    findLedger(
      account,
      ledgerId
    );

  if (!ledger) return;

  const transaction =
    (
      ledger.transactions || []
    ).find(
      item =>
        item.id ===
        transactionId
    );

  if (!transaction) return;

  if (
    !confirm(
      "Delete this transaction?"
    )
  ) {
    return;
  }

  ledger.transactions =
    ledger.transactions.filter(
      item =>
        item.id !==
        transactionId
    );

  recalculateOpenings(
    account
  );

  saveData();

  openLedgerDetails(
    ledgerId
  );

  renderAll();

}


/* =========================================================
   DELETE DAILY LEDGER
========================================================= */

function deleteDailyLedger(
  ledgerId
) {

  const account =
    currentAccount();

  if (!account) return;

  const ledger =
    findLedger(
      account,
      ledgerId
    );

  if (!ledger) return;

  if (
    !confirm(
      "Delete the entire ledger for " +
      formatDate(ledger.date) +
      "?\n\n" +
      "All credits and expenses for this day " +
      "will also be deleted."
    )
  ) {
    return;
  }

  account.ledgers =
    account.ledgers.filter(
      item =>
        item.id !== ledgerId
    );

  recalculateOpenings(
    account
  );

  saveData();

  closeLedgerViewer();

  renderAll();

}


/* =========================================================
   MONTHLY SUMMARY
========================================================= */

function renderMonthlySummary() {

  renderAllAccountSelects();

  const select =
    document.getElementById(
      "monthlyAccount"
    );

  const monthInput =
    document.getElementById(
      "monthlyMonth"
    );

  const account =
    findAccount(
      select?.value
    ) ||
    currentAccount();

  if (!account) return;

  data.selectedAccount =
    account.id;

  const month =
    monthInput?.value ||
    currentMonth();

  if (monthInput) {
    monthInput.value =
      month;
  }

  recalculateOpenings(
    account
  );

  const ledgers =
    getMonthLedgers(
      account,
      month
    );

  let opening =
    Number(account.opening) || 0;

  if (ledgers.length) {

    opening =
      Number(
        ledgers[0].opening
      );

  }

  let credits = 0;
  let expenses = 0;

  ledgers.forEach(ledger => {

    const totals =
      ledgerTotals(ledger);

    credits +=
      totals.credits;

    expenses +=
      totals.expenses;

  });

  let closing =
    opening +
    credits -
    expenses;

  if (ledgers.length) {

    closing =
      ledgerTotals(
        ledgers[
          ledgers.length - 1
        ]
      ).closing;

  }

  setText(
    "monthlyOpening",
    money(opening)
  );

  setText(
    "monthlyCredits",
    money(credits)
  );

  setText(
    "monthlyExpenses",
    money(expenses)
  );

  setText(
    "monthlyClosing",
    money(closing)
  );

  setText(
    "monthlyPrintTitle",
    formatMonth(month) +
    " — MONTHLY SUMMARY"
  );

  setText(
    "monthlyPrintMeta",
    account.name +
    " • " +
    ledgers.length +
    " daily ledgers"
  );

  setText(
    "monthlyPrintOpening",
    money(opening)
  );

  const body =
    document.getElementById(
      "monthlyBody"
    );

  if (body) {

    body.innerHTML = "";

    ledgers.forEach(ledger => {

      const totals =
        ledgerTotals(ledger);

      const row =
        document.createElement("tr");

      row.innerHTML = `

        <td>
          ${formatDate(ledger.date)}
        </td>

        <td class="right">
          ${money(totals.opening)}
        </td>

        <td class="right">
          ${money(totals.credits)}
        </td>

        <td class="right">
          ${money(totals.expenses)}
        </td>

        <td class="right">
          ${money(totals.closing)}
        </td>

      `;

      body.appendChild(row);

    });

  }

  setText(
    "monthlyFooterOpening",
    money(opening)
  );

  setText(
    "monthlyFooterCredits",
    money(credits)
  );

  setText(
    "monthlyFooterExpenses",
    money(expenses)
  );

  setText(
    "monthlyFooterClosing",
    money(closing)
  );

}


/* =========================================================
   PRINT MONTHLY SUMMARY
========================================================= */

function printMonthlySummary() {

  const account =
    currentAccount();

  if (!account) return;

  const month =
    document.getElementById(
      "monthlyMonth"
    )?.value ||
    currentMonth();

  recalculateOpenings(
    account
  );

  const ledgers =
    getMonthLedgers(
      account,
      month
    );

  let opening =
    ledgers.length
      ? ledgerTotals(
          ledgers[0]
        ).opening
      : Number(account.opening) || 0;

  let credits = 0;
  let expenses = 0;

  ledgers.forEach(ledger => {

    const totals =
      ledgerTotals(ledger);

    credits +=
      totals.credits;

    expenses +=
      totals.expenses;

  });

  const closing =
    ledgers.length
      ? ledgerTotals(
          ledgers[
            ledgers.length - 1
          ]
        ).closing
      : opening;

  let rows = "";

  ledgers.forEach(ledger => {

    const totals =
      ledgerTotals(ledger);

    rows += `

      <tr>

        <td>
          ${formatDate(ledger.date)}
        </td>

        <td>
          ${money(totals.opening)}
        </td>

        <td>
          ${money(totals.credits)}
        </td>

        <td>
          ${money(totals.expenses)}
        </td>

        <td>
          ${money(totals.closing)}
        </td>

      </tr>

    `;

  });

  if (!rows) {

    rows = `

      <tr>

        <td colspan="5">
          No daily ledgers.
        </td>

      </tr>

    `;

  }

  const printWindow =
    window.open(
      "",
      "_blank"
    );

  if (!printWindow) {

    alert(
      "Please allow pop-ups to print the ledger."
    );

    return;

  }

  printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
  WOGE Ledger —
  ${formatMonth(month)}
</title>

<style>

@page {

  size: A4 portrait;

  margin: 12mm;

}

* {

  box-sizing:border-box;

}

body {

  margin:0;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  background:#ffffff;

  color:#151515;

}

.header {

  border:2px solid #b88918;

  padding:22px;

  margin-bottom:18px;

  position:relative;

}

.header:after {

  content:"";

  position:absolute;

  left:0;

  right:0;

  bottom:0;

  height:5px;

  background:#b88918;

}

.brand {

  font-size:20px;

  font-weight:800;

  letter-spacing:3px;

  color:#151515;

}

.subtitle {

  color:#8a6918;

  font-size:11px;

  font-weight:bold;

  letter-spacing:2px;

  margin-top:7px;

}

.title {

  font-size:27px;

  font-weight:800;

  margin-top:18px;

}

.meta {

  font-size:13px;

  color:#555;

  margin-top:6px;

}

.summary {

  display:grid;

  grid-template-columns:
    repeat(4,1fr);

  gap:9px;

  margin:18px 0;

}

.box {

  border:1px solid #c5c5c5;

  padding:13px;

  background:#fafafa;

}

.box.highlight {

  border:2px solid #b88918;

  background:#fffaf0;

}

.label {

  font-size:9px;

  font-weight:bold;

  letter-spacing:1.2px;

  color:#777;

}

.value {

  font-size:16px;

  font-weight:800;

  margin-top:7px;

}

table {

  width:100%;

  border-collapse:collapse;

  margin-top:15px;

  font-size:11px;

}

th {

  background:#171717;

  color:#d7b34d;

  padding:10px 8px;

  border:1px solid #171717;

  text-align:left;

  letter-spacing:.6px;

}

td {

  border:1px solid #d4d4d4;

  padding:9px 8px;

}

tfoot td {

  background:#fff8e8;

  border-top:2px solid #b88918;

  font-weight:bold;

}

.right {

  text-align:right;

}

.footer {

  margin-top:30px;

  padding-top:10px;

  border-top:1px solid #b88918;

  font-size:9px;

  color:#777;

  display:flex;

  justify-content:space-between;

}

@media print {

  body {

    -webkit-print-color-adjust:exact;

    print-color-adjust:exact;

  }

}

</style>

</head>

<body>

<div class="header">

  <div class="brand">
    WORD OF GOD ENTERPRISES
  </div>

  <div class="subtitle">
    OFFICIAL BANK WORKSHOP EXPENSE LEDGER
  </div>

  <div class="title">
    ${formatMonth(month)}
    — MONTHLY LEDGER
  </div>

  <div class="meta">
    Account:
    ${escapeHTML(account.name)}
  </div>

</div>


<div class="summary">

  <div class="box">

    <div class="label">
      OPENING BALANCE
    </div>

    <div class="value">
      ${money(opening)}
    </div>

  </div>


  <div class="box">

    <div class="label">
      TOTAL CREDITS
    </div>

    <div class="value">
      ${money(credits)}
    </div>

  </div>


  <div class="box">

    <div class="label">
      TOTAL EXPENSES
    </div>

    <div class="value">
      ${money(expenses)}
    </div>

  </div>


  <div class="box highlight">

    <div class="label">
      CLOSING BALANCE
    </div>

    <div class="value">
      ${money(closing)}
    </div>

  </div>

</div>


<table>

<thead>

<tr>

<th>DATE</th>

<th>OPENING</th>

<th>CREDITS</th>

<th>EXPENSES</th>

<th>CLOSING</th>

</tr>

</thead>

<tbody>

${rows}

</tbody>

<tfoot>

<tr>

<td>
  MONTH TOTAL
</td>

<td>
  ${money(opening)}
</td>

<td>
  ${money(credits)}
</td>

<td>
  ${money(expenses)}
</td>

<td>
  ${money(closing)}
</td>

</tr>

</tfoot>

</table>


<div class="footer">

  <span>
    WORD OF GOD ENTERPRISES
  </span>

  <span>
    Generated:
    ${formatDate(today())}
  </span>

</div>


<script>

window.onload = function() {

  setTimeout(
    function() {
      window.print();
    },
    400
  );

};

<\/script>

</body>

</html>

  `);

  printWindow.document.close();

}


/* =========================================================
   PRINT DAILY LEDGER
========================================================= */

function printDailyLedger(
  ledgerId
) {

  const account =
    currentAccount();

  if (!account) return;

  recalculateOpenings(
    account
  );

  const ledger =
    findLedger(
      account,
      ledgerId
    );

  if (!ledger) {

    alert(
      "Ledger not found."
    );

    return;

  }

  const totals =
    ledgerTotals(ledger);

  let running =
    totals.opening;

  let rows = "";

  (
    ledger.transactions || []
  ).forEach(transaction => {

    const amount =
      Number(transaction.amount) || 0;

    const isCredit =
      transaction.type === "credit";

    if (isCredit) {
      running += amount;
    }
    else {
      running -= amount;
    }

    rows += `

      <tr>

        <td>

          <span
            class="${
              isCredit
                ? "credit"
                : "expense"
            }"
          >

            ${
              isCredit
                ? "CREDIT"
                : "EXPENSE"
            }

          </span>

        </td>

        <td>
          ${escapeHTML(
            transaction.description
          )}
        </td>

        <td class="right">

          ${
            isCredit
              ? "+"
              : "-"
          }${money(amount)}

        </td>

        <td class="right">
          ${money(running)}
        </td>

      </tr>

    `;

  });

  if (!rows) {

    rows = `

      <tr>

        <td colspan="4"
            style="text-align:center;"
        >
          No transactions.
        </td>

      </tr>

    `;

  }

  const printWindow =
    window.open(
      "",
      "_blank"
    );

  if (!printWindow) {

    alert(
      "Please allow pop-ups to print the ledger."
    );

    return;

  }

  printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
  WOGE Daily Ledger
  ${formatDate(ledger.date)}
</title>

<style>

@page {

  size:A4 portrait;

  margin:12mm;

}

* {

  box-sizing:border-box;

}

body {

  margin:0;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  color:#151515;

  background:white;

}

.header {

  border:2px solid #b88918;

  padding:22px;

  position:relative;

  margin-bottom:18px;

}

.header:after {

  content:"";

  position:absolute;

  bottom:0;

  left:0;

  right:0;

  height:5px;

  background:#b88918;

}

.brand {

  font-size:20px;

  font-weight:800;

  letter-spacing:3px;

}

.subtitle {

  margin-top:6px;

  color:#8a6918;

  font-size:10px;

  letter-spacing:2px;

  font-weight:bold;

}

.title {

  margin-top:18px;

  font-size:26px;

  font-weight:800;

}

.meta {

  margin-top:7px;

  color:#555;

  font-size:13px;

}

.summary {

  display:grid;

  grid-template-columns:
    repeat(4,1fr);

  gap:9px;

  margin:18px 0;

}

.box {

  border:1px solid #c7c7c7;

  background:#fafafa;

  padding:13px;

}

.box.highlight {

  border:2px solid #b88918;

  background:#fffaf0;

}

.label {

  font-size:9px;

  color:#777;

  font-weight:bold;

  letter-spacing:1px;

}

.value {

  font-size:16px;

  font-weight:800;

  margin-top:7px;

}

table {

  width:100%;

  border-collapse:collapse;

  font-size:11px;

}

th {

  background:#171717;

  color:#d7b34d;

  padding:10px 8px;

  text-align:left;

  border:1px solid #171717;

}

td {

  border:1px solid #d4d4d4;

  padding:9px 8px;

}

tfoot td {

  background:#fff8e8;

  border-top:2px solid #b88918;

  font-weight:bold;

}

.right {

  text-align:right;

}

.credit {

  font-weight:bold;

  color:#6c5415;

}

.expense {

  font-weight:bold;

  color:#333;

}

.footer {

  margin-top:28px;

  padding-top:10px;

  border-top:1px solid #b88918;

  display:flex;

  justify-content:space-between;

  font-size:9px;

  color:#777;

}

@media print {

  body {

    -webkit-print-color-adjust:exact;

    print-color-adjust:exact;

  }

}

</style>

</head>

<body>


<div class="header">

  <div class="brand">
    WORD OF GOD ENTERPRISES
  </div>

  <div class="subtitle">
    OFFICIAL BANK WORKSHOP EXPENSE LEDGER
  </div>

  <div class="title">
    DAILY LEDGER
  </div>

  <div class="meta">

    Account:
    ${escapeHTML(account.name)}

    &nbsp; • &nbsp;

    Date:
    ${formatDate(ledger.date)}

  </div>

</div>


<div class="summary">

  <div class="box">

    <div class="label">
      OPENING BALANCE
    </div>

    <div class="value">
      ${money(totals.opening)}
    </div>

  </div>


  <div class="box">

    <div class="label">
      TOTAL CREDITS
    </div>

    <div class="value">
      ${money(totals.credits)}
    </div>

  </div>


  <div class="box">

    <div class="label">
      TOTAL EXPENSES
    </div>

    <div class="value">
      ${money(totals.expenses)}
    </div>

  </div>


  <div class="box highlight">

    <div class="label">
      CLOSING BALANCE
    </div>

    <div class="value">
      ${money(totals.closing)}
    </div>

  </div>

</div>


<table>

<thead>

<tr>

<th>TYPE</th>

<th>DESCRIPTION</th>

<th>AMOUNT</th>

<th>BALANCE AFTER</th>

</tr>

</thead>

<tbody>

${rows}

</tbody>

<tfoot>

<tr>

<td colspan="3">
  CLOSING BALANCE
</td>

<td class="right">
  ${money(totals.closing)}
</td>

</tr>

</tfoot>

</table>


<div class="footer">

  <span>
    WORD OF GOD ENTERPRISES
  </span>

  <span>
    Generated:
    ${formatDate(today())}
  </span>

</div>


<script>

window.onload = function() {

  setTimeout(
    function() {
      window.print();
    },
    400
  );

};

<\/script>

</body>

</html>

  `);

  printWindow.document.close();

}


/* =========================================================
   GENERAL PRINT
========================================================= */

function printCurrentPage() {

  window.print();

}


/* =========================================================
   BANK ACCOUNTS
========================================================= */

function renderAccounts() {

  renderAllAccountSelects();

  const container =
    document.getElementById(
      "accountList"
    );

  if (!container) return;

  container.innerHTML = "";

  data.accounts.forEach(account => {

    recalculateOpenings(account);

    const ledgers =
      account.ledgers || [];

    let credits = 0;
    let expenses = 0;

    ledgers.forEach(ledger => {

      const totals =
        ledgerTotals(ledger);

      credits +=
        totals.credits;

      expenses +=
        totals.expenses;

    });

    const balance =
      Number(account.opening) +
      credits -
      expenses;

    const card =
      document.createElement("div");

    card.className =
      "account-card";

    card.innerHTML = `

      <div class="eyebrow">
        BANK ACCOUNT
      </div>

      <h3>
        ${escapeHTML(account.name)}
      </h3>

      <p>
        First Opening Balance
      </p>

      <div class="account-balance">
        ${money(account.opening)}
      </div>

      <p>
        Daily Ledgers:
        <strong>
          ${ledgers.length}
        </strong>
      </p>

      <p>
        Total Credits:
        <strong>
          ${money(credits)}
        </strong>
      </p>

      <p>
        Total Expenses:
        <strong>
          ${money(expenses)}
        </strong>
      </p>

      <p>
        Current Balance:
      </p>

      <div class="account-balance">
        ${money(balance)}
      </div>

      <div class="account-buttons">

        <button
          class="btn gold"
          onclick="useAccount('${account.id}')"
        >
          Use Account
        </button>

        <button
          class="btn outline"
          onclick="openDailyLedger()"
        >
          + Daily Ledger
        </button>

        ${
          data.accounts.length > 1
            ? `
              <button
                class="btn danger"
                onclick="
                  removeAccount(
                    '${account.id}'
                  )
                "
              >
                Delete
              </button>
            `
            : ""
        }

      </div>

    `;

    container.appendChild(card);

  });

}


/* =========================================================
   USE ACCOUNT
========================================================= */

function useAccount(id) {

  if (!findAccount(id)) return;

  data.selectedAccount =
    id;

  saveData();

  renderAll();

  showPage(
    "daily",
    document.querySelector(
      '[onclick*="showPage(\'daily\'"]'
    )
  );

}


/* =========================================================
   ADD ACCOUNT
========================================================= */

function openAccount() {

  const name =
    document.getElementById(
      "accountName"
    );

  const opening =
    document.getElementById(
      "accountOpening"
    );

  if (name) {
    name.value = "";
  }

  if (opening) {
    opening.value = "";
  }

  const modal =
    document.getElementById(
      "accountModal"
    );

  if (modal) {

    modal.style.zIndex =
      "6000";

    modal.classList.add(
      "show"
    );

  }

}


function closeAccount() {

  const modal =
    document.getElementById(
      "accountModal"
    );

  if (modal) {

    modal.classList.remove(
      "show"
    );

  }

}


function saveAccount() {

  const name =
    document.getElementById(
      "accountName"
    )?.value.trim();

  const opening =
    Number(
      document.getElementById(
        "accountOpening"
      )?.value
    );

  if (!name) {

    alert(
      "Please enter bank account name."
    );

    return;

  }

  if (
    !Number.isFinite(opening) ||
    opening < 0
  ) {

    alert(
      "Opening balance cannot be negative."
    );

    return;

  }

  const account = {

    id: createId(),

    name,

    opening,

    ledgers: []

  };

  data.accounts.push(
    account
  );

  data.selectedAccount =
    account.id;

  saveData();

  closeAccount();

  renderAll();

}


/* =========================================================
   DELETE ACCOUNT
========================================================= */

function removeAccount(id) {

  if (
    data.accounts.length <= 1
  ) {

    alert(
      "At least one bank account must remain."
    );

    return;

  }

  const account =
    findAccount(id);

  if (!account) return;

  if (
    !confirm(
      "Delete " +
      account.name +
      " and ALL its daily ledgers?"
    )
  ) {
    return;
  }

  data.accounts =
    data.accounts.filter(
      item =>
        item.id !== id
    );

  if (
    data.selectedAccount === id
  ) {

    data.selectedAccount =
      data.accounts[0].id;

  }

  saveData();

  renderAll();

}


/* =========================================================
   NAVIGATION
========================================================= */

function showPage(
  page,
  button
) {

  const pages = [

    "dashboardPage",
    "dailyPage",
    "monthlyPage",
    "accountsPage",
    "backupPage"

  ];

  pages.forEach(id => {

    const element =
      document.getElementById(id);

    if (element) {

      element.classList.add(
        "hidden"
      );

    }

  });

  const target =
    document.getElementById(
      page + "Page"
    );

  if (target) {

    target.classList.remove(
      "hidden"
    );

  }

  document
    .querySelectorAll(".nav")
    .forEach(nav => {

      nav.classList.remove(
        "active"
      );

    });

  if (button) {

    button.classList.add(
      "active"
    );

  }

  const titles = {

    dashboard:
      "Dashboard",

    daily:
      "Daily Ledgers",

    monthly:
      "Monthly Summary",

    accounts:
      "Bank Accounts",

    backup:
      "Backup & Data"

  };

  setText(
    "pageTitle",
    titles[page] || ""
  );


  if (page === "dashboard") {

    renderDashboard();

  }

  if (page === "daily") {

    renderDailyLedgers();

  }

  if (page === "monthly") {

    renderMonthlySummary();

  }

  if (page === "accounts") {

    renderAccounts();

  }

}


/* =========================================================
   BACKUP EXPORT
========================================================= */

function exportBackup() {

  const backup = {

    application:
      "WOGE Ledger",

    company:
      "WORD OF GOD ENTERPRISES",

    version:
      "3.0",

    exported:
      new Date().toISOString(),

    data

  };

  const blob =
    new Blob(
      [
        JSON.stringify(
          backup,
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
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement("a");

  link.href =
    url;

  link.download =
    "WOGE-Ledger-Backup-" +
    today() +
    ".json";

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    url
  );

}


/* =========================================================
   BACKUP IMPORT
========================================================= */

async function importBackup(
  event
) {

  const file =
    event.target.files?.[0];

  if (!file) return;

  try {

    const text =
      await file.text();

    const imported =
      JSON.parse(text);

    const importedData =
      imported.data ||
      imported;

    if (
      !Array.isArray(
        importedData.accounts
      )
    ) {

      throw new Error(
        "Invalid backup"
      );

    }

    data =
      normalizeData(
        importedData
      );

    saveData();

    renderAll();

    alert(
      "Backup imported successfully."
    );

  }
  catch (error) {

    console.error(error);

    alert(
      "Could not import this backup file."
    );

  }

  event.target.value = "";

}


/* =========================================================
   CLEAR DATA
========================================================= */

function clearAllData() {

  if (
    !confirm(
      "WARNING!\n\n" +
      "This will permanently delete ALL " +
      "bank accounts, daily ledgers, credits " +
      "and expenses from this browser.\n\n" +
      "Please export a backup first.\n\n" +
      "Continue?"
    )
  ) {
    return;
  }

  data =
    normalizeData(
      JSON.parse(
        JSON.stringify(
          defaultData
        )
      )
    );

  data.selectedAccount =
    data.accounts[0]?.id ||
    null;

  saveData();

  renderAll();

}


/* =========================================================
   HELPER: SET TEXT
========================================================= */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (element) {

    element.textContent =
      value;

  }

}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderAll() {

  renderAllAccountSelects();

  renderDashboard();

  renderDailyLedgers();

  renderMonthlySummary();

  renderAccounts();

}


/* =========================================================
   DATE FILTER CHANGE
========================================================= */

document.addEventListener(
  "change",
  function(event) {

    if (
      event.target.id ===
      "ledgerDate"
    ) {

      updateLedgerOpeningPreview();

    }


    if (
      event.target.id ===
      "ledgerAccount"
    ) {

      updateLedgerOpeningPreview();

    }


    if (
      event.target.id ===
      "dailyMonth"
    ) {

      renderDailyLedgers();

    }


    if (
      event.target.id ===
      "dailyAccount"
    ) {

      data.selectedAccount =
        event.target.value;

      saveData();

      renderDailyLedgers();

    }


    if (
      event.target.id ===
      "monthlyMonth"
    ) {

      renderMonthlySummary();

    }


    if (
      event.target.id ===
      "monthlyAccount"
    ) {

      data.selectedAccount =
        event.target.value;

      saveData();

      renderMonthlySummary();

    }


    if (
      event.target.id ===
      "dashboardMonth"
    ) {

      renderDashboard();

    }


    if (
      event.target.id ===
      "dashboardAccount"
    ) {

      changeAccountFromDashboard();

    }

  }
);


/* =========================================================
   MODAL OUTSIDE CLICK
========================================================= */

document.addEventListener(
  "click",
  function(event) {

    const dailyModal =
      document.getElementById(
        "dailyModal"
      );

    const transactionModal =
      document.getElementById(
        "transactionModal"
      );

    const accountModal =
      document.getElementById(
        "accountModal"
      );


    if (
      dailyModal &&
      event.target ===
      dailyModal
    ) {

      closeDailyLedger();

    }


    if (
      transactionModal &&
      event.target ===
      transactionModal
    ) {

      closeTransaction();

    }


    if (
      accountModal &&
      event.target ===
      accountModal
    ) {

      closeAccount();

    }

  }
);


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener(
  "keydown",
  function(event) {

    if (
      event.key !==
      "Escape"
    ) {
      return;
    }

    /*
       If transaction modal is open,
       close ONLY transaction first.
    */

    const transactionModal =
      document.getElementById(
        "transactionModal"
      );

    if (
      transactionModal &&
      transactionModal.classList.contains(
        "show"
      )
    ) {

      closeTransaction();

      return;

    }

    closeDailyLedger();

    closeAccount();

    closeLedgerViewer();

  }
);


/* =========================================================
   INITIALIZE DATES
========================================================= */

function initializeDates() {

  const month =
    currentMonth();

  const dashboardMonth =
    document.getElementById(
      "dashboardMonth"
    );

  const dailyMonth =
    document.getElementById(
      "dailyMonth"
    );

  const monthlyMonth =
    document.getElementById(
      "monthlyMonth"
    );

  if (dashboardMonth) {

    dashboardMonth.value =
      dashboardMonth.value ||
      month;

  }

  if (dailyMonth) {

    dailyMonth.value =
      dailyMonth.value ||
      month;

  }

  if (monthlyMonth) {

    monthlyMonth.value =
      monthlyMonth.value ||
      month;

  }

}


/* =========================================================
   START APP
========================================================= */

initializeDates();

renderAll();


/* =========================================================
   SUPABASE CLOUD SYNC
   ---------------------------------------------------------
   The app keeps localStorage as an offline cache and mirrors
   the complete WOGE_LEDGER_V2 object to one Supabase row.

   Required Supabase table:
     woge_ledger_data

   Columns:
     id   bigint primary key
     data jsonb not null

   Recommended single-row id:
     1
========================================================= */

const WOGE_SUPABASE_URL =
  "https://yiyzphyzlbwscspjuajf.supabase.co";

const WOGE_SUPABASE_KEY =
  "sb_publishable_sJok3gccMB0UZsf-WTIuHw_Dsb-sTro";

const WOGE_SUPABASE_TABLE =
  "woge_ledger_data";

let wogeCloudAvailable = false;
let wogeCloudSaveTimer = null;
let wogeCloudSaveRunning = false;
let wogeCloudSaveQueued = false;
let wogeCloudRevision = 0;

function wogeCloudHeaders() {

  return {
    "apikey": WOGE_SUPABASE_KEY,
    "Authorization":
      "Bearer " + WOGE_SUPABASE_KEY,
    "Content-Type":
      "application/json",
    "Prefer":
      "return=minimal"
  };

}

function wogeCloudUrl() {

  return (
    WOGE_SUPABASE_URL.replace(/\/+$/, "") +
    "/rest/v1/" +
    WOGE_SUPABASE_TABLE
  );

}

function showCloudStatus(text, ok = true) {

  let el =
    document.getElementById(
      "wogeCloudStatus"
    );

  if (!el) {

    el =
      document.createElement("div");

    el.id =
      "wogeCloudStatus";

    el.style.cssText = `
      position:fixed;
      right:18px;
      bottom:18px;
      z-index:999999;
      padding:9px 14px;
      border:1px solid #b88918;
      border-radius:999px;
      background:#0d0d0d;
      color:#d7b34d;
      font:600 12px Arial,sans-serif;
      box-shadow:0 8px 28px rgba(0,0,0,.35);
      pointer-events:none;
    `;

    document.body.appendChild(el);

  }

  el.textContent =
    ok
      ? "☁ " + text
      : "☁ " + text;

}

async function cloudGetData() {

  const response =
    await fetch(
      wogeCloudUrl() +
      "?id=eq.1&select=id,data",
      {
        method:"GET",
        headers:wogeCloudHeaders()
      }
    );

  if (!response.ok) {

    const body =
      await response.text();

    throw new Error(
      "Supabase GET " +
      response.status +
      ": " +
      body
    );

  }

  const rows =
    await response.json();

  return rows?.[0]?.data || null;

}

async function cloudPutData(snapshot) {

  const response =
    await fetch(
      wogeCloudUrl(),
      {
        method:"POST",
        headers: {
          ...wogeCloudHeaders(),
          "Prefer":
            "resolution=merge-duplicates,return=minimal"
        },
        body:JSON.stringify({
          id:1,
          data:snapshot
        })
      }
    );

  if (!response.ok) {

    const body =
      await response.text();

    throw new Error(
      "Supabase SAVE " +
      response.status +
      ": " +
      body
    );

  }

}

async function initializeCloudSync() {

  showCloudStatus(
    "Cloud: Connecting…"
  );

  try {

    const cloudData =
      await cloudGetData();

    if (cloudData) {

      data =
        normalizeData(
          cloudData
        );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
      );

      wogeCloudAvailable =
        true;

      showCloudStatus(
        "Cloud: Connected"
      );

      renderAll();

      return;

    }

    /*
       First device / empty cloud:
       migrate the existing local ledger to cloud.
    */

    await cloudPutData(
      normalizeData(
        JSON.parse(
          JSON.stringify(data)
        )
      )
    );

    wogeCloudAvailable =
      true;

    showCloudStatus(
      "Cloud: Connected"
    );

  }
  catch (error) {

    console.error(
      "WOGE Cloud initialization error:",
      error
    );

    wogeCloudAvailable =
      false;

    showCloudStatus(
      "Cloud: Setup needed",
      false
    );

  }

}

function scheduleCloudSave() {

  wogeCloudRevision++;

  if (!wogeCloudAvailable) {
    return;
  }

  clearTimeout(
    wogeCloudSaveTimer
  );

  wogeCloudSaveTimer =
    setTimeout(
      () => saveToCloud(),
      350
    );

}

async function saveToCloud() {

  if (!wogeCloudAvailable) {
    return;
  }

  if (wogeCloudSaveRunning) {

    wogeCloudSaveQueued =
      true;

    return;

  }

  wogeCloudSaveRunning =
    true;

  const revisionAtStart =
    wogeCloudRevision;

  const snapshot =
    normalizeData(
      JSON.parse(
        JSON.stringify(data)
      )
    );

  try {

    await cloudPutData(
      snapshot
    );

    showCloudStatus(
      "Cloud: Saved"
    );

    /* If something changed while saving, save again. */
    if (
      revisionAtStart !==
      wogeCloudRevision
    ) {

      wogeCloudSaveQueued =
        true;

    }

  }
  catch (error) {

    console.error(
      "WOGE Cloud save error:",
      error
    );

    showCloudStatus(
      "Cloud: Save error",
      false
    );

  }
  finally {

    wogeCloudSaveRunning =
      false;

    if (wogeCloudSaveQueued) {

      wogeCloudSaveQueued =
        false;

      scheduleCloudSave();

    }

  }

}

async function refreshFromCloud() {

  if (!wogeCloudAvailable) {

    await initializeCloudSync();

    return;

  }

  try {

    const cloudData =
      await cloudGetData();

    if (cloudData) {

      const activeLedgerId =
        window.WOGE_ACTIVE_LEDGER_ID ||
        null;

      data =
        normalizeData(
          cloudData
        );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
      );

      renderAll();

      if (activeLedgerId) {
        openLedgerDetails(
          activeLedgerId
        );
      }

    }

    showCloudStatus(
      "Cloud: Connected"
    );

  }
  catch (error) {

    console.error(
      "WOGE Cloud refresh error:",
      error
    );

    showCloudStatus(
      "Cloud: Refresh error",
      false
    );

  }

}

/* =========================================================
   DAILY LEDGER DATE SELECTOR
========================================================= */

function ensureDailyDateFilter() {

  const list =
    document.getElementById(
      "dailyLedgerList"
    );

  if (!list) {
    return;
  }

  let bar =
    document.getElementById(
      "wogeDailyDateBar"
    );

  if (bar) {
    return;
  }

  bar =
    document.createElement("div");

  bar.id =
    "wogeDailyDateBar";

  bar.style.cssText = `
    display:flex;
    align-items:center;
    gap:10px;
    flex-wrap:wrap;
    margin:0 0 18px;
    padding:12px 14px;
    border:1px solid #3a321e;
    border-radius:12px;
    background:#11110f;
  `;

  bar.innerHTML = `
    <label
      for="wogeDailyDateFilter"
      style="
        color:#d7b34d;
        font-weight:700;
        font-size:13px;
      "
    >
      Find Ledger by Date
    </label>

    <input
      id="wogeDailyDateFilter"
      type="date"
      style="
        min-width:170px;
        padding:9px 11px;
        border-radius:8px;
        border:1px solid #6e571f;
        background:#080808;
        color:#f4e4aa;
      "
    >

    <button
      type="button"
      id="wogeDailyDateClear"
      style="
        padding:9px 13px;
        border-radius:8px;
        border:1px solid #6e571f;
        background:#1c1c1c;
        color:#d7b34d;
        cursor:pointer;
      "
    >
      Clear Date
    </button>
  `;

  list.parentNode.insertBefore(
    bar,
    list
  );

  const input =
    document.getElementById(
      "wogeDailyDateFilter"
    );

  const clear =
    document.getElementById(
      "wogeDailyDateClear"
    );

  input?.addEventListener(
    "change",
    () => renderDailyLedgers()
  );

  clear?.addEventListener(
    "click",
    () => {
      if (input) input.value = "";
      renderDailyLedgers();
    }
  );

}

/* =========================================================
   KEEP ACTIVE LEDGER ID
========================================================= */

const originalOpenLedgerDetails =
  openLedgerDetails;

window.WOGE_ACTIVE_LEDGER_ID =
  null;

openLedgerDetails = function(ledgerId) {

  window.WOGE_ACTIVE_LEDGER_ID =
    ledgerId;

  return originalOpenLedgerDetails(
    ledgerId
  );
};

const originalCloseLedgerViewer =
  closeLedgerViewer;

closeLedgerViewer = function() {

  window.WOGE_ACTIVE_LEDGER_ID =
    null;

  return originalCloseLedgerViewer();
};

/* =========================================================
   CLOUD REFRESH WHEN RETURNING TO APP
========================================================= */

document.addEventListener(
  "visibilitychange",
  function() {

    if (
      document.visibilityState ===
      "visible" &&
      wogeCloudAvailable
    ) {

      refreshFromCloud();

    }

  }
);

/* Check periodically so the office computer can see home-PC changes. */

setInterval(
  function() {

    if (
      document.visibilityState ===
      "visible" &&
      wogeCloudAvailable
    ) {

      refreshFromCloud();

    }

  },
  60000
);

/* =========================================================
   INITIAL CLOUD START
========================================================= */

setTimeout(
  function() {
    initializeCloudSync();
  },
  500
);

/* =========================================================
   DEBUG / VERSION
========================================================= */

console.log(
  "WOGE Ledger v3.1 — Cloud Sync loaded successfully."
);
