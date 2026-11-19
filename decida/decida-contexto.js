"use strict";
// Metadados descritivos, não pontuadores. Nunca inferir necessidade pessoal pela categoria.
// Chaves de eventos correspondem à ordem fixa dos seis acontecimentos em decida-eventos.js.
const CONTEXTO_PEDAGOGICO_DECIDA = Object.freeze({
 versao:1,
 objetivos:{
  'Projeto da família':{natureza:'objetivo_pessoal',importancia:'definida_pelo_jogador'},
  'Viagem em família':{natureza:'objetivo_pessoal',importancia:'definida_pelo_jogador'},
  'Equipamento para estudar':{natureza:'objetivo_pessoal',importancia:'definida_pelo_jogador'},
  'Melhoria da casa':{natureza:'objetivo_pessoal',importancia:'definida_pelo_jogador'}
 },
 acontecimentos:[
  {finalidade:'mobilidade_familiar',natureza:'manutencao',urgencia:'desconhecida',necessidadeContextual:'depende_do_uso_do_carro',fonte:'enunciado_e_ressalva'},
  {finalidade:'estudo',natureza:'equipamento_educacional',urgencia:'desconhecida',necessidadeContextual:'alternativas_escola_biblioteca',fonte:'enunciado'},
  {finalidade:'conservacao_de_alimentos',natureza:'necessidade_domestica',urgencia:'alta',necessidadeContextual:'reparo_ou_solucao_temporaria',fonte:'enunciado'},
  {finalidade:'formacao',natureza:'oportunidade_educacional',urgencia:'prazo_da_oportunidade',necessidadeContextual:'depende_da_situacao',fonte:'enunciado'},
  {finalidade:'energia_eletrica',natureza:'conta_essencial',urgencia:'vencimento',necessidadeContextual:'diferenca_da_conta',fonte:'enunciado'},
  {finalidade:'atividade_educativa',natureza:'viagem_escolar',urgencia:'evento_com_data',necessidadeContextual:'participacao_opcional_contextual',fonte:'enunciado'}
 ],
 regras:['objetivo_pessoal_nao_e_gasto_superfluo','ausencia_de_evidencia_nao_prova_dispensabilidade','pagamento_e_necessidade_sao_dimensoes_distintas','nao_altera_pontuacao','contas_habituais_adiadas_sao_agregadas']
});
if(typeof module!=='undefined'&&module.exports)module.exports=CONTEXTO_PEDAGOGICO_DECIDA;
