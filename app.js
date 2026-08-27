/* =========================================================
   WOGE LEDGER
   WORD OF GOD ENTERPRISES

   DAILY LEDGER SYSTEM

   BALANCE =
   OPENING BALANCE
   + CREDITS
   - EXPENSES
========================================================= */


const STORAGE_KEY = "WOGE_LEDGER_V2";


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

let data = loadData();


if (!data.accounts) {

  data.accounts = [];

}


if (!data.selectedAccount) {

  data.selectedAccount =
    data.accounts[0]?.id || null;

}


/* =========================================================
   BASIC FUNCTIONS
========================================================= */

function createId() {

  if (
    window.crypto &&
    crypto.randomUUID
  ) {

    return crypto.randomUUID();

  }

  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .substring(2)
  );

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


function currentMonth() {

  return today().substring(0, 7);

}


function escapeHTML(text) {

  return String(text)

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

  return (
    names[
      Number(parts[1]) - 1
    ] +
    " " +
    parts[0]
  );

}


/* =========================================================
   STORAGE
========================================================= */

function loadData() {

  try {

    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (saved) {

      return JSON.parse(saved);

    }

  }

  catch (error) {

    console.error(
      "Could not load data:",
      error
    );

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


/* =========================================================
   ACCOUNT
========================================================= */

function currentAccount() {

  return data.accounts.find(
    account =>
      account.id ===
      data.selectedAccount
  ) || data.accounts[0];

}


/* =========================================================
   ACCOUNT SELECTS
========================================================= */

function renderAllAccountSelects() {

  const selects = [

    "dashboardAccount",

    "dailyAccount",

    "monthlyAccount",

    "ledgerAccount"

  ];


  selects.forEach(id => {

    const select =
      document.getElementById(id);


    if (!select) return;


    select.innerHTML =
      data.accounts.map(
        account => `

          <option value="${account.id}">
            ${escapeHTML(
              account.name
            )}
          </option>

        `
      ).join("");


    if (currentAccount()) {

      select.value =
        currentAccount().id;

    }

  });

}


/* =========================================================
   CHANGE ACCOUNT
========================================================= */

function changeAccountFromDashboard() {

  const select =
    document.getElementById(
      "dashboardAccount"
    );


  data.selectedAccount =
    select.value;


  saveData();

  syncAccountSelects();

  renderDashboard();

}


function syncAccountSelects() {

  renderAllAccountSelects();

}


/* =========================================================
   CALCULATE LEDGER TOTALS
========================================================= */

function ledgerTotals(ledger) {

  let credits = 0;

  let expenses = 0;


  (ledger.transactions || [])
    .forEach(transaction => {

      if (
        transaction.type ===
        "credit"
      ) {

        credits +=
          Number(
            transaction.amount
          );

      }

      else {

        expenses +=
          Number(
            transaction.amount
          );

      }

    });


  const opening =
    Number(
      ledger.opening
    ) || 0;


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
   SORT LEDGERS
========================================================= */

function sortLedgers(account) {

  if (!account) return [];


  return [
    ...(account.ledgers || [])
  ].sort(
    (a, b) =>
      a.date.localeCompare(
        b.date
      )
  );

}


/* =========================================================
   AUTOMATIC DAILY OPENING BALANCES
========================================================= */

/*
   The first ledger uses the bank account
   opening balance.

   Every following ledger gets the
   previous ledger's closing balance.
*/


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


  saveData();

}


/* =========================================================
   FIND LEDGER
========================================================= */

function findLedger(
  account,
  ledgerId
) {

  if (!account) return null;


  return account.ledgers.find(
    ledger =>
      ledger.id === ledgerId
  ) || null;

}


/* =========================================================
   GET LEDGERS FOR MONTH
========================================================= */

function getMonthLedgers(
  account,
  month
) {

  if (!account) return [];


  return sortLedgers(
    account
  ).filter(
    ledger =>
      ledger.date.startsWith(
        month
      )
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


  const month =
    document.getElementById(
      "dashboardMonth"
    ).value ||
    currentMonth();


  document.getElementById(
    "dashboardMonth"
  ).value =
    month;


  recalculateOpenings(
    account
  );


  const ledgers =
    getMonthLedgers(
      account,
      month
    );


  let monthOpening =
    Number(account.opening) || 0;


  if (ledgers.length) {

    monthOpening =
      Number(
        ledgers[0].opening
      );

  }


  let totalCredits = 0;

  let totalExpenses = 0;


  ledgers.forEach(
    ledger => {

      const totals =
        ledgerTotals(
          ledger
        );


      totalCredits +=
        totals.credits;


      totalExpenses +=
        totals.expenses;

    }
  );


  let closingBalance =
    monthOpening +
    totalCredits -
    totalExpenses;


  if (ledgers.length) {

    closingBalance =
      ledgerTotals(
        ledgers[
          ledgers.length - 1
        ]
      ).closing;

  }


  document.getElementById(
    "dashboardOpening"
  ).textContent =
    money(monthOpening);


  document.getElementById(
    "dashboardCredits"
  ).textContent =
    money(totalCredits);


  document.getElementById(
    "dashboardExpenses"
  ).textContent =
    money(totalExpenses);


  document.getElementById(
    "dashboardBalance"
  ).textContent =
    money(closingBalance);


  document.getElementById(
    "dashboardMeta"
  ).textContent =
    account.name +
    " • " +
    formatMonth(month);


  const body =
    document.getElementById(
      "dashboardLedgerBody"
    );


  body.innerHTML = "";


  ledgers.forEach(
    ledger => {

      const totals =
        ledgerTotals(
          ledger
        );


      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>
          ${formatDate(
            ledger.date
          )}
        </td>

        <td>
          ${money(
            totals.opening
          )}
        </td>

        <td class="right">
          ${money(
            totals.credits
          )}
        </td>

        <td class="right">
          ${money(
            totals.expenses
          )}
        </td>

        <td class="right">
          ${money(
            totals.closing
          )}
        </td>

        <td>

          <button
            class="edit"
            onclick="
              openLedgerDetails(
                '${ledger.id}'
              )
            "
          >
            Open
          </button>

        </td>

      `;


      body.appendChild(row);

    }
  );


  document.getElementById(
    "dashboardEmpty"
  ).style.display =
    ledgers.length
      ? "none"
      : "block";

}


/* =========================================================
   OPEN DAILY LEDGER MODAL
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


  const openingInput =
    document.getElementById(
      "ledgerOpening"
    );


  dateInput.value =
    selectedDate ||
    today();


  accountInput.value =
    account.id;


  /*
     Calculate what the opening balance
     should be for the selected date.
  */

  updateLedgerOpeningPreview();


  modal.classList.add(
    "show"
  );

}


/* =========================================================
   UPDATE OPENING BALANCE PREVIEW
========================================================= */

function updateLedgerOpeningPreview() {

  const accountId =
    document.getElementById(
      "ledgerAccount"
    ).value;


  const date =
    document.getElementById(
      "ledgerDate"
    ).value;


  const account =
    data.accounts.find(
      item =>
        item.id === accountId
    );


  if (!account || !date) return;


  recalculateOpenings(
    account
  );


  const existing =
    account.ledgers.find(
      ledger =>
        ledger.date === date
    );


  if (existing) {

    document.getElementById(
      "ledgerOpening"
    ).value =
      existing.opening;


    return;

  }


  const earlier =
    sortLedgers(
      account
    ).filter(
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


  document.getElementById(
    "ledgerOpening"
  ).value =
    opening;

}


/* =========================================================
   CLOSE DAILY LEDGER
========================================================= */

function closeDailyLedger() {

  document.getElementById(
    "dailyModal"
  ).classList.remove(
    "show"
  );

}


/* =========================================================
   SAVE DAILY LEDGER
========================================================= */

function saveDailyLedger() {

  const accountId =
    document.getElementById(
      "ledgerAccount"
    ).value;


  const date =
    document.getElementById(
      "ledgerDate"
    ).value;


  const opening =
    Number(
      document.getElementById(
        "ledgerOpening"
      ).value
    );


  if (!date) {

    alert(
      "Please select a date."
    );

    return;

  }


  if (opening < 0) {

    alert(
      "Opening balance cannot be negative."
    );

    return;

  }


  const account =
    data.accounts.find(
      item =>
        item.id === accountId
    );


  if (!account) {

    alert(
      "Account not found."
    );

    return;

  }


  if (!account.ledgers) {

    account.ledgers = [];

  }


  /*
     Do not allow two ledgers
     for the same account/date.
  */

  const existing =
    account.ledgers.find(
      ledger =>
        ledger.date === date
    );


  if (existing) {

    alert(
      "A ledger already exists for " +
      formatDate(date) +
      "."
    );

    closeDailyLedger();

    openLedgerDetails(
      existing.id
    );

    return;

  }


  account.ledgers.push({

    id: createId(),

    date,

    opening,

    transactions: [],

    created: Date.now()

  });


  /*
     Sort and recalculate all future
     opening balances.
  */

  recalculateOpenings(
    account
  );


  data.selectedAccount =
    account.id;


  saveData();


  closeDailyLedger();


  renderAll();


  /*
     Open the newly-created ledger
     immediately.
  */

  const created =
    account.ledgers.find(
      ledger =>
        ledger.date === date
    );


  if (created) {

    openLedgerDetails(
      created.id
    );

  }

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
    data.accounts.find(
      item =>
        item.id ===
        select.value
    ) || currentAccount();


  if (!account) return;


  data.selectedAccount =
    account.id;


  const month =
    monthInput.value ||
    currentMonth();


  monthInput.value =
    month;


  recalculateOpenings(
    account
  );


  const ledgers =
    getMonthLedgers(
      account,
      month
    );


  const container =
    document.getElementById(
      "dailyLedgerList"
    );


  container.innerHTML = "";


  ledgers
    .slice()
    .reverse()
    .forEach(
      ledger => {

        const totals =
          ledgerTotals(
            ledger
          );


        const card =
          document.createElement(
            "div"
          );


        card.className =
          "account-card";


        card.innerHTML = `

          <div
            class="eyebrow"
          >
            DAILY LEDGER
          </div>


          <h3>
            ${formatDate(
              ledger.date
            )}
          </h3>


          <p>
            ${escapeHTML(
              account.name
            )}
          </p>


          <p>
            Opening Balance
          </p>


          <div class="account-balance">
            ${money(
              totals.opening
            )}
          </div>


          <p>
            Credits:
            <strong>
              ${money(
                totals.credits
              )}
            </strong>
          </p>


          <p>
            Expenses:
            <strong>
              ${money(
                totals.expenses
              )}
            </strong>
          </p>


          <p>
            Closing Balance:
          </p>


          <div class="account-balance">
            ${money(
              totals.closing
            )}
          </div>


          <p>
            ${ledger.transactions.length}
            transactions
          </p>


          <div class="account-buttons">

            <button
              class="btn gold"
              onclick="
                openLedgerDetails(
                  '${ledger.id}'
                )
              "
            >
              Open Ledger
            </button>


            <button
              class="btn danger"
              onclick="
                deleteDailyLedger(
                  '${ledger.id}'
                )
              "
            >
              Delete
            </button>

          </div>

        `;


        container.appendChild(
          card
        );

      }
    );


  document.getElementById(
    "dailyEmpty"
  ).style.display =
    ledgers.length
      ? "none"
      : "block";

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


  /*
     Build a full-screen temporary
     ledger viewer.
  */

  let existing =
    document.getElementById(
      "ledgerViewer"
    );


  if (!existing) {

    existing =
      document.createElement(
        "div"
      );


    existing.id =
      "ledgerViewer";


    existing.className =
      "modal";


    document.body.appendChild(
      existing
    );

  }


  const totals =
    ledgerTotals(
      ledger
    );


  /*
     Calculate running balances
     transaction by transaction.
  */

  let running =
    totals.opening;


  let transactionRows =
    "";


  const transactions =
    ledger.transactions || [];


  transactions.forEach(
    transaction => {

      const amount =
        Number(
          transaction.amount
        );


      if (
        transaction.type ===
        "credit"
      ) {

        running += amount;

      }

      else {

        running -= amount;

      }


      const typeLabel =
        transaction.type ===
        "credit"
          ? "CREDIT"
          : "EXPENSE";


      transactionRows += `

        <tr>

          <td>
            ${typeLabel}
          </td>

          <td>
            ${escapeHTML(
              transaction.description
            )}
          </td>

          <td class="right">

            ${
              transaction.type ===
              "credit"

              ? "+" +
                money(amount)

              : "-" +
                money(amount)

            }

          </td>

          <td class="right">

            ${money(
              running
            )}

          </td>

          <td
            class="actions no-print"
          >

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

    }
  );


  existing.innerHTML = `

    <div
      class="modal-box"
      style="
        width:min(1000px,96vw);
        max-height:92vh;
        overflow:auto;
      "
    >

      <div
        class="modal-header"
      >

        <div>

          <div
            class="eyebrow"
          >
            WORD OF GOD ENTERPRISES
          </div>

          <h2>
            ${escapeHTML(
              account.name
            )}
            — Daily Ledger
          </h2>

          <div
            style="
              color:#aaa394;
              margin-top:6px;
              font-size:12px;
            "
          >
            ${formatDate(
              ledger.date
            )}
          </div>

        </div>


        <button
          class="close"
          onclick="
            closeLedgerViewer()
          "
        >
          ×
        </button>

      </div>



      <!-- SUMMARY -->

      <div class="cards">

        <div class="card">

          <div class="card-label">
            OPENING
          </div>

          <div class="card-value">
            ${money(
              totals.opening
            )}
          </div>

        </div>


        <div class="card">

          <div class="card-label">
            CREDITS
          </div>

          <div class="card-value">
            ${money(
              totals.credits
            )}
          </div>

        </div>


        <div class="card">

          <div class="card-label">
            EXPENSES
          </div>

          <div class="card-value">
            ${money(
              totals.expenses
            )}
          </div>

        </div>


        <div class="card highlight">

          <div class="card-label">
            CLOSING BALANCE
          </div>

          <div class="card-value">
            ${money(
              totals.closing
            )}
          </div>

        </div>

      </div>



      <!-- TRANSACTIONS -->

      <div
        class="ledger"
        style="
          margin-top:18px;
        "
      >

        <div
          class="ledger-header"
        >

          <div>

            <div
              class="print-brand"
            >
              WORD OF GOD ENTERPRISES
            </div>

            <h2>
              DAILY LEDGER —
              ${formatDate(
                ledger.date
              )}
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

              ${
                transactionRows ||
                `
                  <tr>
                    <td
                      colspan="5"
                      style="
                        text-align:center;
                        padding:35px;
                        color:#777;
                      "
                    >
                      No transactions yet.
                    </td>
                  </tr>
                `
              }

            </tbody>


            <tfoot>

              <tr>

                <td colspan="2">
                  CLOSING BALANCE
                </td>

                <td></td>

                <td class="right">
                  ${money(
                    totals.closing
                  )}
                </td>

                <td
                  class="no-print"
                ></td>

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
          🖨 Print Daily Ledger
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


  existing.classList.add(
    "show"
  );

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
   DELETE DAILY LEDGER
========================================================= */

function deleteDailyLedger(
  ledgerId
) {

  const account =
    currentAccount();


  const ledger =
    findLedger(
      account,
      ledgerId
    );


  if (!ledger) return;


  if (!confirm(
    "Delete the entire ledger for " +
    formatDate(ledger.date) +
    "?\n\nAll credits and expenses in this day will also be deleted."
  )) {

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


  if (!ledger) return;


  document.getElementById(
    "transactionLedgerId"
  ).value =
    ledgerId;


  document.getElementById(
    "transactionId"
  ).value =
    transactionId || "";


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


  if (transactionId) {

    const transaction =
      ledger.transactions.find(
        item =>
          item.id ===
          transactionId
      );


    if (!transaction) return;


    document.getElementById(
      "transactionTitle"
    ).textContent =
      "Edit Transaction";


    type.value =
      transaction.type;


    amount.value =
      transaction.amount;


    description.value =
      transaction.description;

  }

  else {

    document.getElementById(
      "transactionTitle"
    ).textContent =
      "Add Transaction";


    type.value =
      "expense";


    amount.value =
      "";


    description.value =
      "";

  }


  document.getElementById(
    "transactionModal"
  ).classList.add(
    "show"
  );


  setTimeout(
    () =>
      description.focus(),
    100
  );

}


/* =========================================================
   CLOSE TRANSACTION
========================================================= */

function closeTransaction() {

  document.getElementById(
    "transactionModal"
  ).classList.remove(
    "show"
  );

}


/* =========================================================
   SAVE TRANSACTION
========================================================= */

function saveTransaction() {

  const account =
    currentAccount();


  const ledgerId =
    document.getElementById(
      "transactionLedgerId"
    ).value;


  const transactionId =
    document.getElementById(
      "transactionId"
    ).value;


  const type =
    document.getElementById(
      "transactionType"
    ).value;


  const amount =
    Number(
      document.getElementById(
        "transactionAmount"
      ).value
    );


  const description =
    document.getElementById(
      "transactionDescription"
    ).value.trim();


  if (!amount || amount <= 0) {

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


  if (!ledger.transactions) {

    ledger.transactions = [];

  }


  if (transactionId) {

    const index =
      ledger.transactions.findIndex(
        transaction =>
          transaction.id ===
          transactionId
      );


    if (index !== -1) {

      ledger.transactions[
        index
      ] = {

        ...ledger.transactions[
          index
        ],

        type,

        amount,

        description

      };

    }

  }

  else {

    ledger.transactions.push({

      id: createId(),

      type,

      amount,

      description,

      created: Date.now()

    });

  }


  saveData();


  closeTransaction();


  /*
     Recalculate the daily balance
     and every future day's opening.
  */

  recalculateOpenings(
    account
  );


  openLedgerDetails(
    ledgerId
  );


  renderAll();

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
    ledger.transactions.find(
      item =>
        item.id ===
        transactionId
    );


  if (!transaction) return;


  if (!confirm(
    "Delete this transaction?"
  )) {

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
    data.accounts.find(
      item =>
        item.id ===
        select.value
    ) || currentAccount();


  if (!account) return;


  data.selectedAccount =
    account.id;


  const month =
    monthInput.value ||
    currentMonth();


  monthInput.value =
    month;


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


  ledgers.forEach(
    ledger => {

      const totals =
        ledgerTotals(
          ledger
        );


      credits +=
        totals.credits;


      expenses +=
        totals.expenses;

    }
  );


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


  document.getElementById(
    "monthlyOpening"
  ).textContent =
    money(opening);


  document.getElementById(
    "monthlyCredits"
  ).textContent =
    money(credits);


  document.getElementById(
    "monthlyExpenses"
  ).textContent =
    money(expenses);


  document.getElementById(
    "monthlyClosing"
  ).textContent =
    money(closing);


  document.getElementById(
    "monthlyPrintTitle"
  ).textContent =
    formatMonth(month) +
    " — MONTHLY SUMMARY";


  document.getElementById(
    "monthlyPrintMeta"
  ).textContent =
    account.name +
    " • " +
    ledgers.length +
    " daily ledgers";


  document.getElementById(
    "monthlyPrintOpening"
  ).textContent =
    money(opening);


  const body =
    document.getElementById(
      "monthlyBody"
    );


  body.innerHTML = "";


  ledgers.forEach(
    ledger => {

      const totals =
        ledgerTotals(
          ledger
        );


      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>
          ${formatDate(
            ledger.date
          )}
        </td>

        <td class="right">
          ${money(
            totals.opening
          )}
        </td>

        <td class="right">
          ${money(
            totals.credits
          )}
        </td>

        <td class="right">
          ${money(
            totals.expenses
          )}
        </td>

        <td class="right">
          ${money(
            totals.closing
          )}
        </td>

      `;


      body.appendChild(row);

    }
  );


  document.getElementById(
    "monthlyFooterOpening"
  ).textContent =
    money(opening);


  document.getElementById(
    "monthlyFooterCredits"
  ).textContent =
    money(credits);


  document.getElementById(
    "monthlyFooterExpenses"
  ).textContent =
    money(expenses);


  document.getElementById(
    "monthlyFooterClosing"
  ).textContent =
    money(closing);

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
    ).value ||
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
      : account.opening;


  let credits = 0;

  let expenses = 0;


  ledgers.forEach(
    ledger => {

      const totals =
        ledgerTotals(
          ledger
        );


      credits +=
        totals.credits;


      expenses +=
        totals.expenses;

    }
  );


  const closing =
    ledgers.length
      ? ledgerTotals(
          ledgers[
            ledgers.length - 1
          ]
        ).closing
      : opening;


  let rows = "";


  ledgers.forEach(
    ledger => {

      const totals =
        ledgerTotals(
          ledger
        );


      rows += `

        <tr>

          <td>
            ${formatDate(
              ledger.date
            )}
          </td>

          <td>
            ${money(
              totals.opening
            )}
          </td>

          <td>
            ${money(
              totals.credits
            )}
          </td>

          <td>
            ${money(
              totals.expenses
            )}
          </td>

          <td>
            ${money(
              totals.closing
            )}
          </td>

        </tr>

      `;

    }
  );


  const printWindow =
    window.open(
      "",
      "_blank"
    );


  printWindow.document.write(`

    <!DOCTYPE html>

    <html>

    <head>

      <title>
        ${escapeHTML(
          account.name
        )}
        -
        ${formatMonth(month)}
      </title>

      <style>

        body {
          font-family: Arial, sans-serif;
          margin: 30px;
          color: #111;
        }

        h1 {
          margin-bottom: 4px;
        }

        h2 {
          margin-top: 0;
          font-weight: normal;
        }

        .brand {
          font-weight: bold;
          letter-spacing: 2px;
        }

        .summary {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
          margin: 25px 0;
        }

        .box {
          border: 1px solid #bbb;
          padding: 15px;
        }

        .label {
          font-size: 11px;
          color: #666;
        }

        .value {
          font-size: 18px;
          font-weight: bold;
          margin-top: 7px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        th,
        td {
          border: 1px solid #aaa;
          padding: 8px;
          text-align: left;
        }

        th {
          background: #eee;
        }

        .right {
          text-align: right;
        }

        @page {
          size: A4;
          margin: 12mm;
        }

      </style>

    </head>

    <body>

      <div class="brand">
        WORD OF GOD ENTERPRISES
      </div>

      <h1>
        ${formatMonth(month)}
      </h1>

      <h2>
        ${escapeHTML(
          account.name
        )}
        — Monthly Bank Ledger
      </h2>


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


        <div class="box">
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

            <th>
              DATE
            </th>

            <th>
              OPENING
            </th>

            <th>
              CREDITS
            </th>

            <th>
              EXPENSES
            </th>

            <th>
              CLOSING
            </th>

          </tr>

        </thead>


        <tbody>

          ${
            rows ||
            `
              <tr>
                <td colspan="5">
                  No daily ledgers.
                </td>
              </tr>
            `
          }

        </tbody>


        <tfoot>

          <tr>

            <th>
              MONTH TOTAL
            </th>

            <th>
              ${money(opening)}
            </th>

            <th>
              ${money(credits)}
            </th>

            <th>
              ${money(expenses)}
            </th>

            <th>
              ${money(closing)}
            </th>

          </tr>

        </tfoot>

      </table>


      <script>

        window.onload =
          function() {

            window.print();

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


  const ledger =
    findLedger(
      account,
      ledgerId
    );


  if (!ledger) return;


  const totals =
    ledgerTotals(
      ledger
    );


  let running =
    totals.opening;


  let rows = "";


  ledger.transactions
    .forEach(
      transaction => {

        const amount =
          Number(
            transaction.amount
          );


        if (
          transaction.type ===
          "credit"
        ) {

          running +=
            amount;

        }

        else {

          running -=
            amount;

        }


        rows += `

          <tr>

            <td>
              ${
                transaction.type ===
                "credit"
                  ? "CREDIT"
                  : "EXPENSE"
              }
            </td>

            <td>
              ${escapeHTML(
                transaction.description
              )}
            </td>

            <td class="right">
              ${
                transaction.type ===
                "credit"
                  ? "+" +
                    money(amount)
                  : "-" +
                    money(amount)
              }
            </td>

            <td class="right">
              ${money(
                running
              )}
            </td>

          </tr>

        `;

      }
    );


  const printWindow =
    window.open(
      "",
      "_blank"
    );


  printWindow.document.write(`

    <!DOCTYPE html>

    <html>

    <head>

      <title>
        Daily Ledger -
        ${formatDate(
          ledger.date
        )}
      </title>

      <style>

        body {
          font-family: Arial, sans-serif;
          margin: 30px;
          color: #111;
        }

        .brand {
          font-weight: bold;
          letter-spacing: 2px;
        }

        h1 {
          margin-bottom: 4px;
        }

        h2 {
          margin-top: 0;
          font-weight: normal;
        }

        .summary {
          display: grid;
          grid-template-columns:
            repeat(4,1fr);
          gap: 10px;
          margin: 25px 0;
        }

        .box {
          border: 1px solid #aaa;
          padding: 15px;
        }

        .label {
          color: #666;
          font-size: 10px;
        }

        .value {
          font-weight: bold;
          font-size: 18px;
          margin-top: 6px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          border: 1px solid #aaa;
          padding: 8px;
        }

        th {
          background: #eee;
          text-align: left;
        }

        .right {
          text-align: right;
        }

        @page {
          size: A4;
          margin: 12mm;
        }

      </style>

    </head>

    <body>

      <div class="brand">
        WORD OF GOD ENTERPRISES
      </div>

      <h1>
        ${escapeHTML(
          account.name
        )}
        — Daily Ledger
      </h1>

      <h2>
        ${formatDate(
          ledger.date
        )}
      </h2>


      <div class="summary">

        <div class="box">

          <div class="label">
            OPENING
          </div>

          <div class="value">
            ${money(
              totals.opening
            )}
          </div>

        </div>


        <div class="box">

          <div class="label">
            CREDITS
          </div>

          <div class="value">
            ${money(
              totals.credits
            )}
          </div>

        </div>


        <div class="box">

          <div class="label">
            EXPENSES
          </div>

          <div class="value">
            ${money(
              totals.expenses
            )}
          </div>

        </div>


        <div class="box">

          <div class="label">
            CLOSING
          </div>

          <div class="value">
            ${money(
              totals.closing
            )}
          </div>

        </div>

      </div>


      <table>

        <thead>

          <tr>

            <th>
              TYPE
            </th>

            <th>
              DESCRIPTION
            </th>

            <th>
              AMOUNT
            </th>

            <th>
              BALANCE AFTER
            </th>

          </tr>

        </thead>


        <tbody>

          ${
            rows ||
            `
              <tr>
                <td colspan="4">
                  No transactions.
                </td>
              </tr>
            `
          }

        </tbody>


        <tfoot>

          <tr>

            <th colspan="3">
              CLOSING BALANCE
            </th>

            <th class="right">
              ${money(
                totals.closing
              )}
            </th>

          </tr>

        </tfoot>

      </table>


      <script>

        window.onload =
          function() {

            window.print();

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


  container.innerHTML = "";


  data.accounts.forEach(
    account => {

      recalculateOpenings(
        account
      );


      const ledgers =
        account.ledgers || [];


      let credits = 0;

      let expenses = 0;


      ledgers.forEach(
        ledger => {

          const totals =
            ledgerTotals(
              ledger
            );


          credits +=
            totals.credits;


          expenses +=
            totals.expenses;

        }
      );


      const balance =
        Number(account.opening) +
        credits -
        expenses;


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "account-card";


      card.innerHTML = `

        <div class="eyebrow">
          BANK ACCOUNT
        </div>


        <h3>
          ${escapeHTML(
            account.name
          )}
        </h3>


        <p>
          First Opening Balance
        </p>


        <div class="account-balance">
          ${money(
            account.opening
          )}
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
            ${money(
              credits
            )}
          </strong>
        </p>


        <p>
          Total Expenses:
          <strong>
            ${money(
              expenses
            )}
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
            onclick="
              useAccount(
                '${account.id}'
              )
            "
          >
            Use Account
          </button>


          <button
            class="btn outline"
            onclick="
              openDailyLedger()
            "
          >
            + Daily Ledger
          </button>


          ${
            data.accounts.length > 1
              ?
              `
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
              :
              ""
          }

        </div>

      `;


      container.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   USE ACCOUNT
========================================================= */

function useAccount(id) {

  data.selectedAccount =
    id;


  saveData();

  renderAll();


  const ledgerNav =
    document.querySelector(
      '[onclick*="daily"]'
    );


  showPage(
    "daily",
    ledgerNav
  );

}


/* =========================================================
   ADD BANK ACCOUNT
========================================================= */

function openAccount() {

  document.getElementById(
    "accountName"
  ).value = "";


  document.getElementById(
    "accountOpening"
  ).value = "";


  document.getElementById(
    "accountModal"
  ).classList.add(
    "show"
  );

}


function closeAccount() {

  document.getElementById(
    "accountModal"
  ).classList.remove(
    "show"
  );

}


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

    alert(
      "Please enter bank account name."
    );

    return;

  }


  if (opening < 0) {

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
   DELETE BANK ACCOUNT
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
    data.accounts.find(
      item =>
        item.id === id
    );


  if (!account) return;


  if (!confirm(
    "Delete " +
    account.name +
    " and ALL its daily ledgers?"
  )) {

    return;

  }


  data.accounts =
    data.accounts.filter(
      item =>
        item.id !== id
    );


  data.selectedAccount =
    data.accounts[0].id;


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


  pages.forEach(
    id => {

      document
        .getElementById(id)
        .classList.add(
          "hidden"
        );

    }
  );


  document
    .getElementById(
      page + "Page"
    )
    .classList.remove(
      "hidden"
    );


  document
    .querySelectorAll(
      ".nav"
    )
    .forEach(
      nav =>
        nav.classList.remove(
          "active"
        )
    );


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


  document.getElementById(
    "pageTitle"
  ).textContent =
    titles[page];


  if (
    page ===
    "dashboard"
  ) {

    renderDashboard();

  }


  if (
    page ===
    "daily"
  ) {

    renderDailyLedgers();

  }


  if (
    page ===
    "monthly"
  ) {

    renderMonthlySummary();

  }


  if (
    page ===
    "accounts"
  ) {

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
      "2.0",

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
    document.createElement(
      "a"
    );


  link.href =
    url;


  link.download =
    "WOGE-Ledger-Backup-" +
    today() +
    ".json";


  link.click();


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
    event.target.files[0];


  if (!file) return;


  try {

    const text =
      await file.text();


    const imported =
      JSON.parse(text);


    let importedData =
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


    /*
       Support both new V2 format
       and basic older account data.
    */

    importedData.accounts.forEach(
      account => {

        if (!account.ledgers) {

          account.ledgers = [];

        }


        if (!account.opening) {

          account.opening = 0;

        }


        account.ledgers.forEach(
          ledger => {

            if (
              !ledger.transactions
            ) {

              ledger.transactions =
                [];

            }

          }
        );

      }
    );


    data =
      importedData;


    if (
      !data.selectedAccount
    ) {

      data.selectedAccount =
        data.accounts[0]?.id;

    }


    saveData();


    renderAll();


    alert(
      "Backup imported successfully."
    );

  }

  catch(error) {

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

  if (!confirm(
    "WARNING!\n\n" +
    "This will permanently delete ALL " +
    "bank accounts, daily ledgers, credits " +
    "and expenses from this browser.\n\n" +
    "Please export a backup first if necessary.\n\n" +
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


  renderAll();

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
   MODAL CLICK OUTSIDE
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
      event.target ===
      dailyModal
    ) {

      closeDailyLedger();

    }


    if (
      event.target ===
      transactionModal
    ) {

      closeTransaction();

    }


    if (
      event.target ===
      accountModal
    ) {

      closeAccount();

    }

  }
);


/* =========================================================
   DATE / ACCOUNT MODAL PREVIEW
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


    closeDailyLedger();

    closeTransaction();

    closeAccount();

    closeLedgerViewer();

  }
);


/* =========================================================
   INITIALIZE DEFAULT MONTHS
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


  if (dashboardMonth)
    dashboardMonth.value =
      month;


  if (dailyMonth)
    dailyMonth.value =
      month;


  if (monthlyMonth)
    monthlyMonth.value =
      month;

}


/* =========================================================
   INITIALIZE APP
========================================================= */

initializeDates();

renderAll();
