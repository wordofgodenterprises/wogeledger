/* =========================================================
   WOGE LEDGER
   WORD OF GOD ENTERPRISES

   DAILY BANK / WORKSHOP LEDGER

   BALANCE:
   OPENING + CREDITS - EXPENSES = CLOSING
========================================================= */

const STORAGE_KEY = "WOGE_LEDGER_V2";

/* =========================================================
   HELPERS
========================================================= */

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Date.now().toString(36) +
    Math.random().toString(36).substring(2);
}

function money(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
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

  const p = date.split("-");

  if (p.length !== 3) return date;

  return `${p[2]}/${p[1]}/${p[0]}`;
}

function formatMonth(month) {
  if (!month) return "";

  const p = month.split("-");

  if (p.length !== 2) return month;

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

  return `${names[Number(p[1]) - 1]} ${p[0]}`;
}

/* =========================================================
   DEFAULT DATA
========================================================= */

const defaultData = {
  accounts: [
    {
      id: "sbi-default",
      name: "SBI",
      opening: 46000,
      ledgers: []
    }
  ],
  selectedAccount: "sbi-default"
};

/* =========================================================
   STORAGE
========================================================= */

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return JSON.parse(JSON.stringify(defaultData));
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed.accounts)) {
      return JSON.parse(JSON.stringify(defaultData));
    }

    parsed.accounts.forEach(account => {
      if (!Array.isArray(account.ledgers)) {
        account.ledgers = [];
      }

      if (typeof account.opening !== "number") {
        account.opening = Number(account.opening) || 0;
      }

      account.ledgers.forEach(ledger => {
        if (!Array.isArray(ledger.transactions)) {
          ledger.transactions = [];
        }

        if (typeof ledger.opening !== "number") {
          ledger.opening = Number(ledger.opening) || 0;
        }
      });
    });

    if (!parsed.selectedAccount && parsed.accounts.length) {
      parsed.selectedAccount = parsed.accounts[0].id;
    }

    return parsed;
  } catch (error) {
    console.error("WOGE Ledger load error:", error);

    return JSON.parse(JSON.stringify(defaultData));
  }
}

function saveData() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
  } catch (error) {
    console.error("WOGE Ledger save error:", error);
  }
}

let data = loadData();

/* =========================================================
   ACCOUNT HELPERS
========================================================= */

function currentAccount() {
  if (!data.accounts.length) {
    return null;
  }

  let account = data.accounts.find(
    item => item.id === data.selectedAccount
  );

  if (!account) {
    account = data.accounts[0];
    data.selectedAccount = account.id;
    saveData();
  }

  return account;
}

function getAccount(id) {
  return data.accounts.find(
    account => account.id === id
  ) || null;
}

/* =========================================================
   LEDGER HELPERS
========================================================= */

function sortLedgers(account) {
  if (!account) return [];

  return [...(account.ledgers || [])].sort(
    (a, b) => a.date.localeCompare(b.date)
  );
}

function findLedger(account, ledgerId) {
  if (!account) return null;

  return (account.ledgers || []).find(
    ledger => ledger.id === ledgerId
  ) || null;
}

function getMonthLedgers(account, month) {
  return sortLedgers(account).filter(
    ledger => ledger.date.startsWith(month)
  );
}

function ledgerTotals(ledger) {
  let credits = 0;
  let expenses = 0;

  (ledger.transactions || []).forEach(transaction => {
    const amount = Number(transaction.amount) || 0;

    if (transaction.type === "credit") {
      credits += amount;
    } else {
      expenses += amount;
    }
  });

  const opening = Number(ledger.opening) || 0;

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
   AUTOMATIC OPENING BALANCES
========================================================= */

function recalculateOpenings(account) {
  if (!account) return;

  const ledgers = sortLedgers(account);

  let runningBalance =
    Number(account.opening) || 0;

  ledgers.forEach(ledger => {
    ledger.opening = runningBalance;

    const totals = ledgerTotals(ledger);

    runningBalance = totals.closing;
  });

  saveData();
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
    const select = document.getElementById(id);

    if (!select) return;

    const previous = select.value;

    select.innerHTML = "";

    data.accounts.forEach(account => {
      const option = document.createElement("option");

      option.value = account.id;
      option.textContent = account.name;

      select.appendChild(option);
    });

    const active =
      getAccount(data.selectedAccount) ||
      data.accounts[0];

    if (active) {
      select.value = active.id;
    } else if (previous) {
      select.value = previous;
    }
  });
}

function changeAccountFromDashboard() {
  const select =
    document.getElementById("dashboardAccount");

  if (!select) return;

  data.selectedAccount = select.value;

  saveData();

  renderAll();
}

/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {
  renderAllAccountSelects();

  const account = currentAccount();

  if (!account) return;

  const monthInput =
    document.getElementById("dashboardMonth");

  const month =
    monthInput?.value || currentMonth();

  if (monthInput) {
    monthInput.value = month;
  }

  recalculateOpenings(account);

  const ledgers =
    getMonthLedgers(account, month);

  let opening =
    Number(account.opening) || 0;

  if (ledgers.length) {
    opening =
      Number(ledgers[0].opening) || 0;
  }

  let credits = 0;
  let expenses = 0;

  ledgers.forEach(ledger => {
    const totals = ledgerTotals(ledger);

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
        ledgers[ledgers.length - 1]
      ).closing;
  }

  const openingEl =
    document.getElementById("dashboardOpening");

  const creditsEl =
    document.getElementById("dashboardCredits");

  const expensesEl =
    document.getElementById("dashboardExpenses");

  const balanceEl =
    document.getElementById("dashboardBalance");

  if (openingEl) openingEl.textContent = money(opening);
  if (creditsEl) creditsEl.textContent = money(credits);
  if (expensesEl) expensesEl.textContent = money(expenses);
  if (balanceEl) balanceEl.textContent = money(closing);

  const meta =
    document.getElementById("dashboardMeta");

  if (meta) {
    meta.textContent =
      `${account.name} • ${formatMonth(month)}`;
  }

  const body =
    document.getElementById("dashboardLedgerBody");

  if (!body) return;

  body.innerHTML = "";

  ledgers.forEach(ledger => {
    const totals = ledgerTotals(ledger);

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${formatDate(ledger.date)}</td>

      <td>${money(totals.opening)}</td>

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
    document.getElementById("dashboardEmpty");

  if (empty) {
    empty.style.display =
      ledgers.length ? "none" : "block";
  }
}

/* =========================================================
   DAILY LEDGER — CREATE
========================================================= */

function openDailyLedger(selectedDate = null) {
  const account = currentAccount();

  if (!account) {
    alert("Please create a bank account first.");
    return;
  }

  renderAllAccountSelects();

  const modal =
    document.getElementById("dailyModal");

  const dateInput =
    document.getElementById("ledgerDate");

  const accountInput =
    document.getElementById("ledgerAccount");

  if (!modal || !dateInput || !accountInput) return;

  dateInput.value =
    selectedDate || today();

  accountInput.value =
    account.id;

  updateLedgerOpeningPreview();

  modal.classList.add("show");
}

function closeDailyLedger() {
  const modal =
    document.getElementById("dailyModal");

  if (modal) {
    modal.classList.remove("show");
  }
}

function updateLedgerOpeningPreview() {
  const accountInput =
    document.getElementById("ledgerAccount");

  const dateInput =
    document.getElementById("ledgerDate");

  const openingInput =
    document.getElementById("ledgerOpening");

  if (!accountInput || !dateInput || !openingInput) {
    return;
  }

  const account =
    getAccount(accountInput.value);

  const date = dateInput.value;

  if (!account || !date) return;

  recalculateOpenings(account);

  const existing =
    account.ledgers.find(
      ledger => ledger.date === date
    );

  if (existing) {
    openingInput.value = existing.opening;
    return;
  }

  const previous =
    sortLedgers(account)
      .filter(ledger => ledger.date < date)
      .pop();

  let opening =
    Number(account.opening) || 0;

  if (previous) {
    opening =
      ledgerTotals(previous).closing;
  }

  openingInput.value = opening;
}

function saveDailyLedger() {
  const accountId =
    document.getElementById("ledgerAccount")?.value;

  const date =
    document.getElementById("ledgerDate")?.value;

  const opening =
    Number(
      document.getElementById("ledgerOpening")?.value
    );

  if (!date) {
    alert("Please select a date.");
    return;
  }

  if (!Number.isFinite(opening) || opening < 0) {
    alert("Please enter a valid opening balance.");
    return;
  }

  const account = getAccount(accountId);

  if (!account) {
    alert("Bank account not found.");
    return;
  }

  if (!Array.isArray(account.ledgers)) {
    account.ledgers = [];
  }

  const existing =
    account.ledgers.find(
      ledger => ledger.date === date
    );

  if (existing) {
    closeDailyLedger();

    openLedgerDetails(existing.id);

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

  data.selectedAccount = account.id;

  recalculateOpenings(account);

  saveData();

  closeDailyLedger();

  renderAll();

  openLedgerDetails(ledger.id);
}

/* =========================================================
   DAILY LEDGERS LIST
========================================================= */

function renderDailyLedgers() {
  renderAllAccountSelects();

  const accountSelect =
    document.getElementById("dailyAccount");

  const monthInput =
    document.getElementById("dailyMonth");

  if (!accountSelect || !monthInput) return;

  const account =
    getAccount(accountSelect.value) ||
    currentAccount();

  if (!account) return;

  data.selectedAccount = account.id;

  const month =
    monthInput.value || currentMonth();

  monthInput.value = month;

  recalculateOpenings(account);

  const ledgers =
    getMonthLedgers(account, month);

  const container =
    document.getElementById("dailyLedgerList");

  const empty =
    document.getElementById("dailyEmpty");

  if (!container) return;

  container.innerHTML = "";

  ledgers
    .slice()
    .reverse()
    .forEach(ledger => {
      const totals = ledgerTotals(ledger);

      const card =
        document.createElement("div");

      card.className = "account-card";

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
          transaction(s)
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

  if (empty) {
    empty.style.display =
      ledgers.length ? "none" : "block";
  }
}

/* =========================================================
   LEDGER DETAILS
========================================================= */

function openLedgerDetails(ledgerId) {
  const account = currentAccount();

  if (!account) return;

  recalculateOpenings(account);

  const ledger =
    findLedger(account, ledgerId);

  if (!ledger) {
    alert("Ledger not found.");
    return;
  }

  let viewer =
    document.getElementById("ledgerViewer");

  if (!viewer) {
    viewer =
      document.createElement("div");

    viewer.id = "ledgerViewer";
    viewer.className = "modal";

    document.body.appendChild(viewer);
  }

  const totals =
    ledgerTotals(ledger);

  let running =
    totals.opening;

  let rows = "";

  (ledger.transactions || []).forEach(transaction => {
    const amount =
      Number(transaction.amount) || 0;

    if (transaction.type === "credit") {
      running += amount;
    } else {
      running -= amount;
    }

    const isCredit =
      transaction.type === "credit";

    rows += `
      <tr>

        <td>
          <span
            class="${
              isCredit
                ? "credit-badge"
                : "expense-badge"
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
          ${escapeHTML(transaction.description)}
        </td>

        <td class="right ${
          isCredit ? "credit" : "expense"
        }">

          ${
            isCredit ? "+" : "-"
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
            padding:35px;
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
        width:min(1000px,96vw);
        max-height:92vh;
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
              font-size:12px;
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


      <div class="cards">

        <div class="card">

          <div class="card-label">
            OPENING
          </div>

          <div class="card-value">
            ${money(totals.opening)}
          </div>

        </div>


        <div class="card">

          <div class="card-label">
            CREDITS
          </div>

          <div class="card-value">
            ${money(totals.credits)}
          </div>

        </div>


        <div class="card">

          <div class="card-label">
            EXPENSES
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


      <div
        class="ledger"
        style="margin-top:18px;"
      >

        <div class="ledger-header">

          <div>

            <div class="print-brand">
              WORD OF GOD ENTERPRISES
            </div>

            <h2>
              DAILY TRANSACTIONS
            </h2>

          </div>

          <button
            class="btn gold no-print"
            onclick="openTransaction('${ledger.id}')"
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


      <div class="modal-buttons no-print">

        <button
          class="btn outline"
          onclick="printDailyLedger('${ledger.id}')"
        >
          🖨 Print Daily Ledger
        </button>

        <button
          class="btn gold"
          onclick="openTransaction('${ledger.id}')"
        >
          + Add Transaction
        </button>

      </div>

    </div>
  `;

  viewer.classList.add("show");
}

function closeLedgerViewer() {
  const viewer =
    document.getElementById("ledgerViewer");

  if (viewer) {
    viewer.classList.remove("show");
  }
}

/* =========================================================
   DELETE DAILY LEDGER
========================================================= */

function deleteDailyLedger(ledgerId) {
  const account = currentAccount();

  if (!account) return;

  const ledger =
    findLedger(account, ledgerId);

  if (!ledger) return;

  const confirmed =
    confirm(
      `Delete the entire ledger for ${formatDate(
        ledger.date
      )}?\n\nAll credits and expenses for this day will also be deleted.`
    );

  if (!confirmed) return;

  account.ledgers =
    account.ledgers.filter(
      item => item.id !== ledgerId
    );

  recalculateOpenings(account);

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
  const account = currentAccount();

  if (!account) return;

  const ledger =
    findLedger(account, ledgerId);

  if (!ledger) return;

  const ledgerIdInput =
    document.getElementById("transactionLedgerId");

  const transactionIdInput =
    document.getElementById("transactionId");

  const typeInput =
    document.getElementById("transactionType");

  const amountInput =
    document.getElementById("transactionAmount");

  const descriptionInput =
    document.getElementById("transactionDescription");

  const title =
    document.getElementById("transactionTitle");

  const modal =
    document.getElementById("transactionModal");

  if (
    !ledgerIdInput ||
    !transactionIdInput ||
    !typeInput ||
    !amountInput ||
    !descriptionInput ||
    !title ||
    !modal
  ) {
    return;
  }

  ledgerIdInput.value = ledgerId;

  transactionIdInput.value =
    transactionId || "";

  if (transactionId) {
    const transaction =
      ledger.transactions.find(
        item => item.id === transactionId
      );

    if (!transaction) return;

    title.textContent = "Edit Transaction";

    typeInput.value = transaction.type;
    amountInput.value = transaction.amount;
    descriptionInput.value =
      transaction.description;
  } else {
    title.textContent = "Add Transaction";

    typeInput.value = "expense";
    amountInput.value = "";
    descriptionInput.value = "";
  }

  modal.classList.add("show");

  setTimeout(() => {
    descriptionInput.focus();
  }, 100);
}

function closeTransaction() {
  const modal =
    document.getElementById("transactionModal");

  if (modal) {
    modal.classList.remove("show");
  }
}

/* =========================================================
   SAVE TRANSACTION
========================================================= */

function saveTransaction() {
  const account = currentAccount();

  if (!account) {
    alert("Bank account not found.");
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
    )?.value.trim();

  if (!ledgerId) {
    alert("Ledger not found.");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  if (!description) {
    alert("Please enter a description.");
    return;
  }

  if (
    type !== "credit" &&
    type !== "expense"
  ) {
    alert("Please select Credit or Expense.");
    return;
  }

  const ledger =
    findLedger(account, ledgerId);

  if (!ledger) {
    alert("Ledger not found.");
    return;
  }

  if (!Array.isArray(ledger.transactions)) {
    ledger.transactions = [];
  }

  if (transactionId) {
    const index =
      ledger.transactions.findIndex(
        transaction =>
          transaction.id === transactionId
      );

    if (index === -1) {
      alert("Transaction not found.");
      return;
    }

    ledger.transactions[index] = {
      ...ledger.transactions[index],
      type,
      amount,
      description
    };
  } else {
    ledger.transactions.push({
      id: createId(),
      type,
      amount,
      description,
      created: Date.now()
    });
  }

  recalculateOpenings(account);

  saveData();

  /*
     Refresh the ledger viewer.
  */
  openLedgerDetails(ledgerId);

  renderAll();

  /*
     IMPORTANT:
     Keep transaction window open after saving.

     This allows continuous entry:
     Expense → Save → Expense → Save → Credit → Save
  */

  const transactionIdInput =
    document.getElementById("transactionId");

  const amountInput =
    document.getElementById("transactionAmount");

  const descriptionInput =
    document.getElementById(
      "transactionDescription"
    );

  const typeInput =
    document.getElementById("transactionType");

  const title =
    document.getElementById("transactionTitle");

  const modal =
    document.getElementById("transactionModal");

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
    title.textContent = "Add Transaction";
  }

  if (modal) {
    modal.classList.add("show");
  }

  setTimeout(() => {
    if (descriptionInput) {
      descriptionInput.focus();
    }
  }, 100);
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
  const account = currentAccount();

  if (!account) return;

  const ledger =
    findLedger(account, ledgerId);

  if (!ledger) return;

  const transaction =
    ledger.transactions.find(
      item => item.id === transactionId
    );

  if (!transaction) return;

  if (!confirm("Delete this transaction?")) {
    return;
  }

  ledger.transactions =
    ledger.transactions.filter(
      item => item.id !== transactionId
    );

  recalculateOpenings(account);

  saveData();

  openLedgerDetails(ledgerId);

  renderAll();
}

/* =========================================================
   MONTHLY SUMMARY
========================================================= */

function renderMonthlySummary() {
  renderAllAccountSelects();

  const accountSelect =
    document.getElementById("monthlyAccount");

  const monthInput =
    document.getElementById("monthlyMonth");

  if (!accountSelect || !monthInput) return;

  const account =
    getAccount(accountSelect.value) ||
    currentAccount();

  if (!account) return;

  data.selectedAccount = account.id;

  const month =
    monthInput.value || currentMonth();

  monthInput.value = month;

  recalculateOpenings(account);

  const ledgers =
    getMonthLedgers(account, month);

  let opening =
    Number(account.opening) || 0;

  if (ledgers.length) {
    opening =
      Number(ledgers[0].opening) || 0;
  }

  let credits = 0;
  let expenses = 0;

  ledgers.forEach(ledger => {
    const totals = ledgerTotals(ledger);

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
        ledgers[ledgers.length - 1]
      ).closing;
  }

  const setText = (id, value) => {
    const element =
      document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  };

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
    `${formatMonth(month)} — MONTHLY SUMMARY`
  );

  setText(
    "monthlyPrintMeta",
    `${account.name} • ${ledgers.length} daily ledgers`
  );

  setText(
    "monthlyPrintOpening",
    money(opening)
  );

  const body =
    document.getElementById("monthlyBody");

  if (!body) return;

  body.innerHTML = "";

  ledgers.forEach(ledger => {
    const totals = ledgerTotals(ledger);

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
   MONTHLY PRINT
========================================================= */

function printMonthlySummary() {
  const account = currentAccount();

  if (!account) return;

  const month =
    document.getElementById(
      "monthlyMonth"
    )?.value || currentMonth();

  recalculateOpenings(account);

  const ledgers =
    getMonthLedgers(account, month);

  let opening =
    Number(account.opening) || 0;

  if (ledgers.length) {
    opening =
      Number(ledgers[0].opening) || 0;
  }

  let credits = 0;
  let expenses = 0;

  ledgers.forEach(ledger => {
    const totals = ledgerTotals(ledger);

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
        ledgers[ledgers.length - 1]
      ).closing;
  }

  let rows = "";

  ledgers.forEach(ledger => {
    const totals = ledgerTotals(ledger);

    rows += `
      <tr>
        <td>${formatDate(ledger.date)}</td>
        <td>${money(totals.opening)}</td>
        <td class="credit">
          +${money(totals.credits)}
        </td>
        <td class="expense">
          -${money(totals.expenses)}
        </td>
        <td>${money(totals.closing)}</td>
      </tr>
    `;
  });

  if (!rows) {
    rows = `
      <tr>
        <td colspan="5">
          No daily ledgers recorded.
        </td>
      </tr>
    `;
  }

  openPrintWindow(
    `${account.name} - ${formatMonth(month)}`,
    `
      <div class="header">
        <div class="brand">
          WOGE LEDGER
        </div>

        <div class="company">
          WORD OF GOD ENTERPRISES
        </div>

        <div class="subtitle">
          BANK WORKSHOP EXPENSE & ACCOUNT LEDGER
        </div>
      </div>

      <div class="content">

        <div class="gold-line"></div>

        <h1>
          ${escapeHTML(account.name)}
        </h1>

        <h2>
          ${formatMonth(month)}
          — Monthly Ledger
        </h2>

        <div class="summary">

          <div class="box">
            <label>OPENING BALANCE</label>
            <strong>
              ${money(opening)}
            </strong>
          </div>

          <div class="box">
            <label>TOTAL CREDITS</label>
            <strong class="credit">
              +${money(credits)}
            </strong>
          </div>

          <div class="box">
            <label>TOTAL EXPENSES</label>
            <strong class="expense">
              -${money(expenses)}
            </strong>
          </div>

          <div class="box closing">
            <label>CLOSING BALANCE</label>
            <strong>
              ${money(closing)}
            </strong>
          </div>

        </div>

        <h3>
          DAILY LEDGER SUMMARY
        </h3>

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

        </table>

        <div class="closing-section">

          <span>
            MONTH ENDING BALANCE
          </span>

          <strong>
            ${money(closing)}
          </strong>

        </div>

        <div class="signature">
          Authorized / Verified By
        </div>

        <div class="footer">
          WORD OF GOD ENTERPRISES
          <span>
            Printed ${new Date().toLocaleDateString("en-IN")}
          </span>
        </div>

      </div>
    `
  );
}

/* =========================================================
   DAILY PRINT
========================================================= */

function printDailyLedger(ledgerId) {
  const account = currentAccount();

  if (!account) return;

  const ledger =
    findLedger(account, ledgerId);

  if (!ledger) {
    alert("Ledger not found.");
    return;
  }

  const totals =
    ledgerTotals(ledger);

  let running =
    totals.opening;

  let rows = "";

  const transactions =
    ledger.transactions || [];

  transactions.forEach(
    (transaction, index) => {

      const amount =
        Number(transaction.amount) || 0;

      const isCredit =
        transaction.type === "credit";

      if (isCredit) {
        running += amount;
      } else {
        running -= amount;
      }

      rows += `
        <tr>

          <td class="number">
            ${index + 1}
          </td>

          <td>
            ${formatDate(ledger.date)}
          </td>

          <td>
            <span class="${
              isCredit
                ? "credit-badge"
                : "expense-badge"
            }">
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

          <td class="amount ${
            isCredit
              ? "credit"
              : "expense"
          }">

            ${
              isCredit
                ? "+"
                : "-"
            }${money(amount)}

          </td>

          <td class="balance">
            ${money(running)}
          </td>

        </tr>
      `;
    }
  );

  if (!rows) {
    rows = `
      <tr>
        <td
          colspan="6"
          class="no-data"
        >
          No transactions recorded
          for this day.
        </td>
      </tr>
    `;
  }

  openPrintWindow(
    `${account.name} - Daily Ledger`,
    `
      <div class="header">

        <div class="brand">
          WOGE LEDGER
        </div>

        <div class="company">
          WORD OF GOD ENTERPRISES
        </div>

        <div class="subtitle">
          BANK WORKSHOP EXPENSE & ACCOUNT LEDGER
        </div>

        <div class="date-box">
          DAILY LEDGER<br>
          ${formatDate(ledger.date)}
        </div>

      </div>


      <div class="content">

        <div class="gold-line"></div>

        <h1>
          ${escapeHTML(account.name)}
          — Daily Ledger
        </h1>

        <div class="subtitle-dark">
          ${formatDate(ledger.date)}
        </div>


        <div class="summary">

          <div class="box">
            <label>
              OPENING BALANCE
            </label>

            <strong>
              ${money(totals.opening)}
            </strong>
          </div>


          <div class="box">
            <label>
              TOTAL CREDITS
            </label>

            <strong class="credit">
              +${money(totals.credits)}
            </strong>
          </div>


          <div class="box">
            <label>
              TOTAL EXPENSES
            </label>

            <strong class="expense">
              -${money(totals.expenses)}
            </strong>
          </div>


          <div class="box closing">
            <label>
              CLOSING BALANCE
            </label>

            <strong>
              ${money(totals.closing)}
            </strong>
          </div>

        </div>


        <h3>
          TRANSACTION DETAILS
        </h3>


        <table>

          <thead>

            <tr>

              <th>
                #
              </th>

              <th>
                DATE
              </th>

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
            ${rows}
          </tbody>


          <tfoot>

            <tr>

              <th colspan="5">
                CLOSING BALANCE
              </th>

              <th>
                ${money(totals.closing)}
              </th>

            </tr>

          </tfoot>

        </table>


        <div class="closing-section">

          <span>
            DAY ENDING BALANCE
          </span>

          <strong>
            ${money(totals.closing)}
          </strong>

        </div>


        <div class="signature">
          Authorized / Verified By
        </div>


        <div class="footer">

          <strong>
            WORD OF GOD ENTERPRISES
          </strong>

          <span>
            WOGE Ledger • Daily Statement
          </span>

          <span>
            Printed:
            ${new Date().toLocaleDateString("en-IN")}
          </span>

        </div>

      </div>
    `
  );
}

/* =========================================================
   PRINT WINDOW
========================================================= */

function openPrintWindow(title, content) {
  const printWindow =
    window.open(
      "",
      "_blank",
      "width=1000,height=800"
    );

  if (!printWindow) {
    alert(
      "Please allow pop-ups for the WOGE Ledger website."
    );
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>

    <html>

    <head>

      <meta charset="UTF-8">

      <title>
        ${escapeHTML(title)}
      </title>

      <style>

        @page {
          size: A4;
          margin: 10mm;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          color: #171717;
          background: white;
          font-size: 10px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .header {
          position: relative;
          background: #090909;
          color: white;
          padding: 22px 24px;
          border-bottom: 5px solid #d4af37;
        }

        .brand {
          color: #d4af37;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3px;
          margin-bottom: 7px;
        }

        .company {
          font-size: 21px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .subtitle {
          margin-top: 6px;
          color: #bdbdbd;
          font-size: 8px;
          letter-spacing: 1px;
        }

        .date-box {
          position: absolute;
          right: 24px;
          top: 23px;
          text-align: right;
          color: #d4af37;
          font-weight: 800;
          font-size: 8px;
          line-height: 1.7;
          letter-spacing: 1px;
        }

        .content {
          padding: 18px 8px;
        }

        .gold-line {
          height: 2px;
          background: #d4af37;
          margin-bottom: 17px;
        }

        h1 {
          margin: 0;
          font-size: 19px;
          font-weight: 800;
        }

        h2 {
          margin: 5px 0 0;
          font-size: 13px;
          font-weight: 500;
          color: #555;
        }

        h3 {
          margin: 23px 0 8px;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .subtitle-dark {
          color: #666;
          margin-top: 5px;
        }

        .summary {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 7px;
          margin: 18px 0 23px;
        }

        .box {
          min-height: 65px;
          border: 1px solid #d5d5d5;
          border-top: 3px solid #111;
          padding: 10px;
        }

        .box.closing {
          background: #fffdf3;
          border-color: #d4af37;
        }

        .box label {
          display: block;
          color: #777;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .box strong {
          display: block;
          margin-top: 8px;
          font-size: 14px;
        }

        .credit {
          color: #267348;
        }

        .expense {
          color: #a23931;
        }

        .closing strong {
          color: #997510;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead th {
          background: #090909;
          color: white;
          border: 1px solid #090909;
          padding: 8px 6px;
          text-align: left;
          font-size: 7px;
          letter-spacing: .8px;
        }

        tbody td,
        tfoot th {
          border-bottom: 1px solid #ddd;
          padding: 7px 6px;
        }

        tbody tr:nth-child(even) {
          background: #fafafa;
        }

        tfoot th {
          background: #fffdf3;
          border-top: 2px solid #d4af37;
          font-weight: 800;
        }

        .number {
          text-align: center;
          color: #888;
        }

        .amount,
        .balance {
          text-align: right;
          white-space: nowrap;
          font-weight: 700;
        }

        .credit-badge,
        .expense-badge {
          display: inline-block;
          padding: 3px 6px;
          border-radius: 2px;
          font-size: 6px;
          font-weight: 800;
          letter-spacing: .5px;
        }

        .credit-badge {
          color: #176239;
          border: 1px solid #8bc9a3;
          background: #f1faf4;
        }

        .expense-badge {
          color: #9b3129;
          border: 1px solid #e0aaa5;
          background: #fff5f4;
        }

        .no-data {
          text-align: center;
          padding: 30px;
          color: #777;
        }

        .closing-section {
          margin-top: 18px;
          padding: 13px 16px;
          border: 1px solid #d4af37;
          background: #fffdf3;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 800;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .closing-section strong {
          color: #997510;
          font-size: 18px;
        }

        .signature {
          margin-top: 38px;
          margin-left: auto;
          width: 170px;
          text-align: center;
          border-top: 1px solid #555;
          padding-top: 5px;
          font-size: 8px;
          color: #666;
        }

        .footer {
          margin-top: 30px;
          padding-top: 9px;
          border-top: 1px solid #d4af37;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #777;
          font-size: 7px;
        }

        .footer strong {
          color: #171717;
          letter-spacing: 1px;
        }

        @media print {

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .header,
          thead th {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

        }

      </style>

    </head>

    <body>

      ${content}

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
    document.getElementById("accountList");

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

      credits += totals.credits;
      expenses += totals.expenses;
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
                onclick="removeAccount('${account.id}')"
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

function useAccount(id) {
  if (!getAccount(id)) return;

  data.selectedAccount = id;

  saveData();

  renderAll();

  const nav =
    document.querySelector(
      '[onclick*="daily"]'
    );

  showPage("daily", nav);
}

/* =========================================================
   ADD ACCOUNT
========================================================= */

function openAccount() {
  const name =
    document.getElementById("accountName");

  const opening =
    document.getElementById("accountOpening");

  if (name) name.value = "";
  if (opening) opening.value = "";

  document
    .getElementById("accountModal")
    ?.classList.add("show");
}

function closeAccount() {
  document
    .getElementById("accountModal")
    ?.classList.remove("show");
}

function saveAccount() {
  const name =
    document
      .getElementById("accountName")
      ?.value.trim();

  const opening =
    Number(
      document
        .getElementById("accountOpening")
        ?.value
    );

  if (!name) {
    alert("Please enter bank account name.");
    return;
  }

  if (!Number.isFinite(opening) || opening < 0) {
    alert("Please enter a valid opening balance.");
    return;
  }

  const account = {
    id: createId(),
    name,
    opening,
    ledgers: []
  };

  data.accounts.push(account);

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
  if (data.accounts.length <= 1) {
    alert(
      "At least one bank account must remain."
    );
    return;
  }

  const account =
    getAccount(id);

  if (!account) return;

  if (
    !confirm(
      `Delete ${account.name} and ALL its daily ledgers?`
    )
  ) {
    return;
  }

  data.accounts =
    data.accounts.filter(
      item => item.id !== id
    );

  data.selectedAccount =
    data.accounts[0].id;

  saveData();

  renderAll();
}

/* =========================================================
   NAVIGATION
========================================================= */

function showPage(page, button) {
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
      element.classList.add("hidden");
    }
  });

  const selected =
    document.getElementById(
      `${page}Page`
    );

  if (selected) {
    selected.classList.remove("hidden");
  }

  document
    .querySelectorAll(".nav")
    .forEach(nav => {
      nav.classList.remove("active");
    });

  if (button) {
    button.classList.add("active");
  }

  const titles = {
    dashboard: "Dashboard",
    daily: "Daily Ledgers",
    monthly: "Monthly Summary",
    accounts: "Bank Accounts",
    backup: "Backup & Data"
  };

  const title =
    document.getElementById("pageTitle");

  if (title) {
    title.textContent =
      titles[page] || "Dashboard";
  }

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
   BACKUP
========================================================= */

function exportBackup() {
  const backup = {
    application: "WOGE Ledger",
    company: "WORD OF GOD ENTERPRISES",
    version: "2.0",
    exported: new Date().toISOString(),
    data: data
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
        type: "application/json"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `WOGE-Ledger-Backup-${today()}.json`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);
}

async function importBackup(event) {
  const file =
    event.target.files?.[0];

  if (!file) return;

  try {
    const text =
      await file.text();

    const imported =
      JSON.parse(text);

    const importedData =
      imported.data || imported;

    if (
      !Array.isArray(
        importedData.accounts
      )
    ) {
      throw new Error(
        "Invalid backup file"
      );
    }

    importedData.accounts.forEach(account => {
      if (!Array.isArray(account.ledgers)) {
        account.ledgers = [];
      }

      account.ledgers.forEach(ledger => {
        if (!Array.isArray(ledger.transactions)) {
          ledger.transactions = [];
        }
      });
    });

    data = importedData;

    if (
      !data.selectedAccount ||
      !getAccount(data.selectedAccount)
    ) {
      data.selectedAccount =
        data.accounts[0]?.id || null;
    }

    saveData();

    renderAll();

    alert(
      "Backup imported successfully."
    );
  } catch (error) {
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
    JSON.parse(
      JSON.stringify(
        defaultData
      )
    );

  saveData();

  renderAll();
}

/* =========================================================
   INITIALIZATION
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
    dashboardMonth.value = month;
  }

  if (dailyMonth) {
    dailyMonth.value = month;
  }

  if (monthlyMonth) {
    monthlyMonth.value = month;
  }
}

/* =========================================================
   MODAL EVENTS
========================================================= */

document.addEventListener(
  "click",
  event => {

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
   DATE / ACCOUNT CHANGE
========================================================= */

document.addEventListener(
  "change",
  event => {

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
   ESCAPE
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (event.key !== "Escape") {
      return;
    }

    closeDailyLedger();
    closeTransaction();
    closeAccount();
    closeLedgerViewer();

  }
);

/* =========================================================
   START APPLICATION
========================================================= */

initializeDates();

renderAll();
