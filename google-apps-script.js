// ================================================================
// FILTRO DO SONHO — Google Apps Script
// ================================================================
// Como instalar:
// 1. Abra sua planilha no Google Sheets
// 2. Clique em Extensões → Apps Script
// 3. Apague o código existente e cole TODO este arquivo
// 4. Salve (Ctrl+S)
// 5. Clique em Implantar → Nova implantação
// 6. Tipo: App da Web
// 7. Executar como: Eu mesmo
// 8. Quem tem acesso: Qualquer pessoa
// 9. Clique em Implantar → copie a URL gerada
// 10. Cole a URL no app em Configurações → Sincronizar
// ================================================================

const APP_TAB_NAME = '📱 APP';

// ── Ponto de entrada GET ──────────────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action || 'test';

    if (action === 'test') {
      return json({ ok: true, message: 'Conexão funcionando! 🎉' });
    }

    if (action === 'read') {
      const month = parseInt(e.parameter.month);
      const year  = parseInt(e.parameter.year);
      return json(readFromMonthlySheet(month, year));
    }

    return json({ error: 'Ação inválida' });
  } catch (err) {
    return json({ error: err.message });
  }
}

// ── Ponto de entrada POST ─────────────────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'write')  return json(writeToAppTab(body));
    if (action === 'delete') return json(deleteFromAppTab(body.app_id));

    return json({ error: 'Ação inválida' });
  } catch (err) {
    return json({ error: err.message });
  }
}

// ── Tab 📱 APP ────────────────────────────────────────────────
function getOrCreateAppTab() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ws   = ss.getSheetByName(APP_TAB_NAME);

  if (!ws) {
    ws = ss.insertSheet(APP_TAB_NAME);
    const headers = ['APP_ID','TIPO','DATA','DESCRIÇÃO','VALOR','CATEGORIA','MÊS','ANO'];
    ws.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold')
      .setBackground('#22c55e')
      .setFontColor('#ffffff');
    ws.setFrozenRows(1);
    ws.setColumnWidth(1, 220);
    ws.setColumnWidth(4, 300);
  }
  return ws;
}

function writeToAppTab(data) {
  const ws = getOrCreateAppTab();

  // Evita duplicatas pelo APP_ID
  const existing = ws.getDataRange().getValues();
  for (let i = 1; i < existing.length; i++) {
    if (String(existing[i][0]) === String(data.app_id)) {
      return { success: true, skipped: true, reason: 'Já existe' };
    }
  }

  const dateObj = data.data ? new Date(data.data + 'T12:00:00') : new Date();

  ws.appendRow([
    data.app_id,
    data.tipo,       // 'receita' | 'despesa'
    dateObj,
    data.descricao,
    data.valor,
    data.categoria || '',
    data.mes,
    data.ano,
  ]);

  // Formata data na célula
  const lastRow = ws.getLastRow();
  ws.getRange(lastRow, 3).setNumberFormat('dd/mm/yyyy');
  ws.getRange(lastRow, 5).setNumberFormat('R$ #,##0.00');

  return { success: true };
}

function deleteFromAppTab(appId) {
  const ws   = getOrCreateAppTab();
  const data = ws.getDataRange().getValues();

  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === String(appId)) {
      ws.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: 'Entrada não encontrada' };
}

// ── Leitura da aba mensal (MM.AA) ─────────────────────────────
function readFromMonthlySheet(month, year) {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const mm        = String(month).padStart(2, '0');
  const yy        = String(year).slice(-2);
  const sheetName = mm + '.' + yy;
  const ws        = ss.getSheetByName(sheetName);

  if (!ws) {
    return {
      error: 'Aba "' + sheetName + '" não encontrada na planilha.',
      income: [], expenses: []
    };
  }

  const vals = ws.getDataRange().getValues();
  const income   = [];
  const expenses = [];

  // Descrições que devem ser ignoradas (cabeçalhos, totais)
  const IGNORE = [
    'APLICAÇÃO','TOTAL FIXO','TOTAL ENTRADA','SAIDAS','SAÍDAS',
    'DESPESAS FIXAS','RECEITAS FIXAS','DATA','ENTRADAS',
    'DESPESAS VARIÁVEIS','DESPESAS VARIAVEIS',
    'CONTAS A PAGAR','OBRAS APTO 404','DESCRIÇÃO','DATA '
  ];

  for (let i = 0; i < vals.length; i++) {
    const date   = vals[i][1];  // Coluna B
    const desc   = vals[i][2];  // Coluna C
    const amount = vals[i][3];  // Coluna D
    const status = vals[i][7];  // Coluna H

    if (!desc) continue;
    const descStr = String(desc).trim();
    if (!descStr) continue;
    if (IGNORE.includes(descStr)) continue;

    const numAmount = typeof amount === 'number' ? amount
      : (typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : 0);

    if (!numAmount || numAmount <= 0) continue;

    const dateStr = date instanceof Date
      ? Utilities.formatDate(date, 'America/Sao_Paulo', 'yyyy-MM-dd')
      : null;

    // Linhas 7–15 (índice 6–14) = RECEITAS
    if (i >= 6 && i <= 14) {
      income.push({ date: dateStr, description: descStr, amount: numAmount });
    }

    // Linha 21+ (índice 20+) = DESPESAS
    if (i >= 20) {
      expenses.push({
        date: dateStr,
        description: descStr,
        amount: numAmount,
        status: String(status || 'NÃO PAGO')
      });
    }
  }

  return { sheet: sheetName, income, expenses };
}

// ── Utilitário ────────────────────────────────────────────────
function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
