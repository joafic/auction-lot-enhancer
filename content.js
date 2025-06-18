function extrairValorDeTexto(texto) {
  return parseFloat(texto.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
}

function formatarBRL(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function obterValorDeMercado() {
  const tabela = document.querySelector('.auction-lot-vehicle table.table.table-striped.mb-0');
  if (!tabela) return null;

  const linhas = tabela.querySelectorAll('tr');
  for (const tr of linhas) {
    const tds = tr.querySelectorAll('td');
    if (tds.length === 2 && tds[0].innerText.trim() === 'Valor de mercado:') {
      const textoValor = tds[1].innerText.trim();
      const match = textoValor.match(/R\$\s*([\d\.]+),\d{2}/);
      if (match) {
        const numeroStr = match[1].replace(/\./g, '');
        return parseInt(numeroStr, 10);
      }
    }
  }

  return null;
}

function inserirDadosCalculados(summary) {
  if (document.getElementById('info-calculada')) return;

  const highestBidEl = document.querySelector('[data-name="highest_bid"]');
  const minIncrementEl = document.querySelector('[data-name="increment_value"]');

  const valorMaiorLance = highestBidEl ? parseFloat(highestBidEl.getAttribute('data-value')) : 0;
  const valorIncrementoMinimo = minIncrementEl ? parseFloat(minIncrementEl.getAttribute('data-value')) : 0;
  
  if (!valorMaiorLance) {
    console.log('Parece que o item não teve valor ofertado, por isso não será realizar o cálculo')
    return
  }

  const comissaoLeiloeiro = 0.05;
  const taxaPatioVeiculos = 1700;
  const taxaPatioMotos = 500;
  const taxaLeiloeiro = valorMaiorLance * comissaoLeiloeiro;
  const taxaPatio = valorIncrementoMinimo > 500 ? taxaPatioVeiculos : taxaPatioMotos;
  const valorFinal = valorMaiorLance + taxaLeiloeiro + taxaPatio;
  let percentualFipe = 0;

  if (Number.isFinite(valorFinal) && Number.isFinite(this.obterValorDeMercado())) {
    percentualFipe = (valorFinal / this.obterValorDeMercado()) * 100;
  }

  const novaDiv = document.createElement('div');
  novaDiv.id = 'info-calculada';
  novaDiv.style.marginTop = '10px';
  novaDiv.style.padding = '10px';
  novaDiv.style.border = '1px solid #ccc';
  novaDiv.style.background = '#f9f9f9';
  novaDiv.style.display = 'flex';
  novaDiv.innerHTML = `
  <div class="row">
    <div class="col">
      <strong>Custos:</strong><br>
      
      Taxa leiloeiro (5%): ${formatarBRL(taxaLeiloeiro)}<br>
      Taxa de Pátio: ${formatarBRL(taxaPatio)}<br>
      
    </div>
    <div class="col">
      <div class="alert alert-info" role="alert">
        <span style="color: green;">
          <b>Valor Final: <span style="font-size:18px">${formatarBRL(valorFinal)}</span></b>
        </span><br>
        <span><b>${percentualFipe.toFixed(2)}%</b><br>do preço de tabela.</span>
      </div>

    </div>
  </div>
  `;

  summary.insertAdjacentElement('afterend', novaDiv);
}

// Observa o body por mudanças
const observer = new MutationObserver((e) => {
  const target = document.querySelector('.bids-summary');
  for (const mutation of mutations) {
    // Verifica se houve mudança relevante dentro do container
    if (mutation.type === 'childList' || mutation.type === 'subtree') {
      inserirDadosCalculados(target);
      break;  // só precisa rodar uma vez por evento
    }
  }
});

function iniciarObserver() {
  const target = document.querySelector('.bids-summary');
  if (!target) {
    // se não existir ainda, tenta novamente em 1s
    setTimeout(iniciarObserver, 1000);
    return;
  }
  observer.observe(target, { childList: true, subtree: true });
  inserirDadosCalculados(target);
}

iniciarObserver();
