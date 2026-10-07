# Medição do FAQ no celular

Navegador: Chromium 153.0.8010.12 via Playwright 1.63.0, headless, mobile emulado (isMobile, touch), viewport 390×844 @2x.
Amostragem: 600 ms após cada clique, via requestAnimationFrame; 3 ciclos abrir/fechar por pergunta (duração = mediana; frames intermediários = melhor ciclo; FPS e maior frame = pior ciclo).

## CPU 4x

Sonda de CPU (loop de 2e7 iterações na página): 89.8 ms

| pergunta | abriu | fechou | duração abrir/fechar (ms) | frames interm. abrir/fechar | FPS médio (pior) | maior frame (ms) | passou |
|---|---|---|---|---|---|---|---|
| O que mudou do Evo IX para o Evo X? | sim | sim | 9 / 9.5 | 0 / 0 | 60 | 16.8 | falhou |
| O que é o S-AWC? | sim | sim | 10.2 / 9.7 | 0 / 0 | 60 | 16.8 | falhou |
| O câmbio era manual ou automático? | sim | sim | 10.1 / 9.6 | 0 / 0 | 60 | 16.8 | falhou |
| Até quando o Evo X foi produzido? | sim | sim | 9.5 / 9.8 | 0 / 0 | 60 | 16.8 | falhou |

Animações ativas dentro do FAQ (document.getAnimations): transform ::after
Ícone +/× ao abrir: 17 frames / 325.6 ms; 17 frames / 326.8 ms; 17 frames / 326.8 ms; 17 frames / 326.2 ms
Altura do <details> da 1ª pergunta ao abrir: de 62px para 225px, mudança concluída em 9 ms
CSS computado: {"details":"all 0s / anim none","summary":"all 0s / anim none","answer":"all 0s / anim none","icon_after":"transform 0.3s / anim none","details_content":"all 0s / anim none"}

Critérios que falharam:
- O que mudou do Evo IX para o Evo X?: duração ao abrir: 9 ms (alvo 150–400); frames intermediários de altura/opacidade ao abrir: 0 (mín. 5); frames em que o conteúdo abaixo desce ao abrir: 0 (mín. 5); duração ao fechar: 9.5 ms (alvo 150–400); frames intermediários de altura/opacidade ao fechar: 0 (mín. 5); frames em que o conteúdo abaixo desce ao fechar: 0 (mín. 5)
- O que é o S-AWC?: duração ao abrir: 10.2 ms (alvo 150–400); frames intermediários de altura/opacidade ao abrir: 0 (mín. 5); frames em que o conteúdo abaixo desce ao abrir: 0 (mín. 5); duração ao fechar: 9.7 ms (alvo 150–400); frames intermediários de altura/opacidade ao fechar: 0 (mín. 5); frames em que o conteúdo abaixo desce ao fechar: 0 (mín. 5)
- O câmbio era manual ou automático?: duração ao abrir: 10.1 ms (alvo 150–400); frames intermediários de altura/opacidade ao abrir: 0 (mín. 5); frames em que o conteúdo abaixo desce ao abrir: 0 (mín. 5); duração ao fechar: 9.6 ms (alvo 150–400); frames intermediários de altura/opacidade ao fechar: 0 (mín. 5); frames em que o conteúdo abaixo desce ao fechar: 0 (mín. 5)
- Até quando o Evo X foi produzido?: duração ao abrir: 9.5 ms (alvo 150–400); frames intermediários de altura/opacidade ao abrir: 0 (mín. 5); frames em que o conteúdo abaixo desce ao abrir: 0 (mín. 5); duração ao fechar: 9.8 ms (alvo 150–400); frames intermediários de altura/opacidade ao fechar: 0 (mín. 5); frames em que o conteúdo abaixo desce ao fechar: 0 (mín. 5)

## sem throttling

Sonda de CPU (loop de 2e7 iterações na página): 23.9 ms

| pergunta | abriu | fechou | duração abrir/fechar (ms) | frames interm. abrir/fechar | FPS médio (pior) | maior frame (ms) | passou |
|---|---|---|---|---|---|---|---|
| O que mudou do Evo IX para o Evo X? | sim | sim | 7.4 / 10.2 | 0 / 0 | 60 | 16.8 | falhou |
| O que é o S-AWC? | sim | sim | 10.4 / 10.6 | 0 / 0 | 60 | 16.8 | falhou |
| O câmbio era manual ou automático? | sim | sim | 11.2 / 11.4 | 0 / 0 | 60 | 16.8 | falhou |
| Até quando o Evo X foi produzido? | sim | sim | 11.2 / 11 | 0 / 0 | 60 | 16.8 | falhou |

Animações ativas dentro do FAQ (document.getAnimations): transform ::after
Ícone +/× ao abrir: 17 frames / 324.1 ms; 17 frames / 327 ms; 17 frames / 327.9 ms; 17 frames / 327.8 ms
Altura do <details> da 1ª pergunta ao abrir: de 62px para 225px, mudança concluída em 7.4 ms
CSS computado: {"details":"all 0s / anim none","summary":"all 0s / anim none","answer":"all 0s / anim none","icon_after":"transform 0.3s / anim none","details_content":"all 0s / anim none"}

Critérios que falharam:
- O que mudou do Evo IX para o Evo X?: duração ao abrir: 7.4 ms (alvo 150–400); frames intermediários de altura/opacidade ao abrir: 0 (mín. 5); frames em que o conteúdo abaixo desce ao abrir: 0 (mín. 5); duração ao fechar: 10.2 ms (alvo 150–400); frames intermediários de altura/opacidade ao fechar: 0 (mín. 5); frames em que o conteúdo abaixo desce ao fechar: 0 (mín. 5)
- O que é o S-AWC?: duração ao abrir: 10.4 ms (alvo 150–400); frames intermediários de altura/opacidade ao abrir: 0 (mín. 5); frames em que o conteúdo abaixo desce ao abrir: 0 (mín. 5); duração ao fechar: 10.6 ms (alvo 150–400); frames intermediários de altura/opacidade ao fechar: 0 (mín. 5); frames em que o conteúdo abaixo desce ao fechar: 0 (mín. 5)
- O câmbio era manual ou automático?: duração ao abrir: 11.2 ms (alvo 150–400); frames intermediários de altura/opacidade ao abrir: 0 (mín. 5); frames em que o conteúdo abaixo desce ao abrir: 0 (mín. 5); duração ao fechar: 11.4 ms (alvo 150–400); frames intermediários de altura/opacidade ao fechar: 0 (mín. 5); frames em que o conteúdo abaixo desce ao fechar: 0 (mín. 5)
- Até quando o Evo X foi produzido?: duração ao abrir: 11.2 ms (alvo 150–400); frames intermediários de altura/opacidade ao abrir: 0 (mín. 5); frames em que o conteúdo abaixo desce ao abrir: 0 (mín. 5); duração ao fechar: 11 ms (alvo 150–400); frames intermediários de altura/opacidade ao fechar: 0 (mín. 5); frames em que o conteúdo abaixo desce ao fechar: 0 (mín. 5)

## CPU 4x + prefers-reduced-motion

Sonda de CPU (loop de 2e7 iterações na página): 84.6 ms

| pergunta | abriu | fechou | duração abrir/fechar (ms) | frames interm. abrir/fechar | FPS médio (pior) | maior frame (ms) | passou |
|---|---|---|---|---|---|---|---|
| O que mudou do Evo IX para o Evo X? | sim | sim | 9.4 / 12.1 | 0 / 0 | 60 | 16.8 | falhou |
| O que é o S-AWC? | sim | sim | 10.8 / 11.8 | 0 / 0 | 60 | 16.8 | falhou |
| O câmbio era manual ou automático? | sim | sim | 11 / 10.6 | 0 / 0 | 60 | 16.8 | falhou |
| Até quando o Evo X foi produzido? | sim | sim | 11.4 / 10.6 | 0 / 0 | 60 | 16.8 | falhou |

Animações ativas dentro do FAQ (document.getAnimations): nenhuma
Ícone +/× ao abrir: 0 frames / 9.4 ms; 0 frames / 10.8 ms; 0 frames / 11 ms; 0 frames / 11.4 ms
Altura do <details> da 1ª pergunta ao abrir: de 62px para 225px, mudança concluída em 9.4 ms
CSS computado: {"details":"all 0s / anim none","summary":"all 0s / anim none","answer":"all 0s / anim none","icon_after":"none 0s / anim none","details_content":"all 0s / anim none"}

Critérios que falharam:
- O que mudou do Evo IX para o Evo X?: duração ao abrir: 9.4 ms (alvo 150–400); frames intermediários de altura/opacidade ao abrir: 0 (mín. 5); frames em que o conteúdo abaixo desce ao abrir: 0 (mín. 5); duração ao fechar: 12.1 ms (alvo 150–400); frames intermediários de altura/opacidade ao fechar: 0 (mín. 5); frames em que o conteúdo abaixo desce ao fechar: 0 (mín. 5)
- O que é o S-AWC?: duração ao abrir: 10.8 ms (alvo 150–400); frames intermediários de altura/opacidade ao abrir: 0 (mín. 5); frames em que o conteúdo abaixo desce ao abrir: 0 (mín. 5); duração ao fechar: 11.8 ms (alvo 150–400); frames intermediários de altura/opacidade ao fechar: 0 (mín. 5); frames em que o conteúdo abaixo desce ao fechar: 0 (mín. 5)
- O câmbio era manual ou automático?: duração ao abrir: 11 ms (alvo 150–400); frames intermediários de altura/opacidade ao abrir: 0 (mín. 5); frames em que o conteúdo abaixo desce ao abrir: 0 (mín. 5); duração ao fechar: 10.6 ms (alvo 150–400); frames intermediários de altura/opacidade ao fechar: 0 (mín. 5); frames em que o conteúdo abaixo desce ao fechar: 0 (mín. 5)
- Até quando o Evo X foi produzido?: duração ao abrir: 11.4 ms (alvo 150–400); frames intermediários de altura/opacidade ao abrir: 0 (mín. 5); frames em que o conteúdo abaixo desce ao abrir: 0 (mín. 5); duração ao fechar: 10.6 ms (alvo 150–400); frames intermediários de altura/opacidade ao fechar: 0 (mín. 5); frames em que o conteúdo abaixo desce ao fechar: 0 (mín. 5)

## sem throttling + prefers-reduced-motion

Sonda de CPU (loop de 2e7 iterações na página): 24.4 ms

| pergunta | abriu | fechou | duração abrir/fechar (ms) | frames interm. abrir/fechar | FPS médio (pior) | maior frame (ms) | passou |
|---|---|---|---|---|---|---|---|
| O que mudou do Evo IX para o Evo X? | sim | sim | 12.7 / 11.4 | 0 / 0 | 60 | 16.8 | falhou |
| O que é o S-AWC? | sim | sim | 12.4 / 11.2 | 0 / 0 | 60 | 16.8 | falhou |
| O câmbio era manual ou automático? | sim | sim | 11.8 / 12.8 | 0 / 0 | 60 | 16.8 | falhou |
| Até quando o Evo X foi produzido? | sim | sim | 9.7 / 14.2 | 0 / 0 | 60 | 16.8 | falhou |

Animações ativas dentro do FAQ (document.getAnimations): nenhuma
Ícone +/× ao abrir: 0 frames / 12.7 ms; 0 frames / 12.4 ms; 0 frames / 11.8 ms; 0 frames / 9.7 ms
Altura do <details> da 1ª pergunta ao abrir: de 62px para 225px, mudança concluída em 12.7 ms
CSS computado: {"details":"all 0s / anim none","summary":"all 0s / anim none","answer":"all 0s / anim none","icon_after":"none 0s / anim none","details_content":"all 0s / anim none"}

Critérios que falharam:
- O que mudou do Evo IX para o Evo X?: duração ao abrir: 12.7 ms (alvo 150–400); frames intermediários de altura/opacidade ao abrir: 0 (mín. 5); frames em que o conteúdo abaixo desce ao abrir: 0 (mín. 5); duração ao fechar: 11.4 ms (alvo 150–400); frames intermediários de altura/opacidade ao fechar: 0 (mín. 5); frames em que o conteúdo abaixo desce ao fechar: 0 (mín. 5)
- O que é o S-AWC?: duração ao abrir: 12.4 ms (alvo 150–400); frames intermediários de altura/opacidade ao abrir: 0 (mín. 5); frames em que o conteúdo abaixo desce ao abrir: 0 (mín. 5); duração ao fechar: 11.2 ms (alvo 150–400); frames intermediários de altura/opacidade ao fechar: 0 (mín. 5); frames em que o conteúdo abaixo desce ao fechar: 0 (mín. 5)
- O câmbio era manual ou automático?: duração ao abrir: 11.8 ms (alvo 150–400); frames intermediários de altura/opacidade ao abrir: 0 (mín. 5); frames em que o conteúdo abaixo desce ao abrir: 0 (mín. 5); duração ao fechar: 12.8 ms (alvo 150–400); frames intermediários de altura/opacidade ao fechar: 0 (mín. 5); frames em que o conteúdo abaixo desce ao fechar: 0 (mín. 5)
- Até quando o Evo X foi produzido?: duração ao abrir: 9.7 ms (alvo 150–400); frames intermediários de altura/opacidade ao abrir: 0 (mín. 5); frames em que o conteúdo abaixo desce ao abrir: 0 (mín. 5); duração ao fechar: 14.2 ms (alvo 150–400); frames intermediários de altura/opacidade ao fechar: 0 (mín. 5); frames em que o conteúdo abaixo desce ao fechar: 0 (mín. 5)

