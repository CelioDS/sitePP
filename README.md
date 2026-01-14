
# 📄 Documentação do Sistema de Agendamento e Antecipação de Instalação

**Time:** P&P  
**Data:** 23/10/2025  

---

## **Índice**
1. [Resumo Executivo](#resumo-executivo)  
2. [Objetivo do Projeto](#objetivo-do-projeto)  
3. [Arquitetura do Sistema](#arquitetura-do-sistema)  
4. Fluxo Geral  
5. Funcionalidades  
6. [Banco de Dados](#banco-de-dados)  
7. [Fluxo de Login e Segurança](#fluxo-de-login-e-segurança)  
8. [Tecnologias Utilizadas](#tecnologias-utilizadas)  
9. [Sistema de Envio de WhatsApp](#sistema-de-envio-de-whatsapp)  
10. Relatórios e Métricas  
11. [Próximas Melhorias](#próximas-melhoriasxecutivo**
O sistema tem como objetivo gerenciar agendamentos de clientes, facilitando o controle interno e comunicação via WhatsApp. Ele substitui a planilha online, evitando erros como nomes incorretos, filtros alterados e bloqueio da conta do WhatsApp por mensagens repetitivas.

---

r falhas no processo de agendamento e antecipação, garantindo:
- Preenchimento correto dos dados.
- Comunicação personalizada com clientes.
- Relatórios confiáveis para gestão.

---

## **Arquitetura do Sistema**
**Frontend:**  
- React  
- Axios  
- React-ApexCharts  
- React-Toastify  

**Backend:**  
- Node.js  
- Express  
- Axios  
- Bcrypt  
- MySQL  
- Nodemon  
- whatsapp-web.js  
- Cors  

**Banco de Dados:**  
- MySQL (Workbench / XAMPP)  

**Diagrama Simplificado:**  
```mermaid
flowchart LR
A[Usuário] --> B[Frontend React]
B --> C[Backend Node.js]
C --> D[MySQL]
C --> E[WhatsApp API]
