# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- O carro SVG existe em duas cópias: o hero e `<g id="evo-static">` (SVG oculto perto do fim, usado na seção Aero). Mudar a silhueta exige editar as duas e reposicionar os pontos de destaque.
- Se mudar potência ou peso, atualize também `data-to="182"` e o `182 / 250` do `#meter`; nada os liga aos outros números. O 9 de "curvas" é calculado pelo JS, não edite o texto.
- O painel de preview do app não abre `file://`: sirva com `python -m http.server 5173` e encerre depois (não há `pkill` neste shell).
- Os números técnicos são de memória, sem fonte verificada. Mantenha o aviso do rodapé de que não há vínculo com a Mitsubishi.
