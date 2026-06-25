// Default LaTeX shown on first load (FRONTEND.md §1, lib/).
// String.raw keeps backslashes literal so the LaTeX is not mangled by JS escapes.
export const SAMPLE_RESUME = String.raw`%-------------------------
% FINAL 1-PAGE Resume - Tanishq Bhosale
%------------------------
\documentclass[letterpaper,8pt]{article}
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\usepackage{fontawesome5}
\usepackage{multicol}
\usepackage{xcolor}

\setlength{\multicolsep}{-3.0pt}
\setlength{\columnsep}{-1pt}
\input{glyphtounicode}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

\addtolength{\oddsidemargin}{-0.6in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1.19in}
\addtolength{\topmargin}{-.7in}
\addtolength{\textheight}{1.4in}
\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

\titleformat{\section}{\vspace{-4pt}\scshape\raggedright\large\bfseries}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

\pdfgentounicode=1

\newcommand{\resumeItem}[1]{\item\small{#1 \vspace{-2pt}}}
\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
  \begin{tabular*}{1.0\textwidth}[t]{l@{\extracolsep{\fill}}r}
    \textbf{#1} & \textbf{\small #2} \\
    \textit{\small#3} & \textit{\small #4} \\
  \end{tabular*}\vspace{-7pt}
}
\newcommand{\resumeProjectHeading}[2]{
  \item
  \begin{tabular*}{1.001\textwidth}{l@{\extracolsep{\fill}}r}
    \small#1 & \textbf{\small #2}\\
  \end{tabular*}\vspace{-7pt}
}
\renewcommand\labelitemi{$\vcenter{\hbox{\tiny$\bullet$}}$}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.0in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}

\begin{document}

\begin{center}
    {\Huge \scshape Tanishq Bhosale} \\ \vspace{1pt}
    Bangalore \\ \vspace{1pt}
    \small
    \raisebox{-0.1\height}\faPhone\ +91 6362157894 ~
    \href{mailto:bhosaletanishq4@gmail.com}{\raisebox{-0.2\height}\faEnvelope\ \underline{bhosaletanishq4@gmail.com}} ~
    \href{https://www.linkedin.com/in/tanishq-bhosale/}{\raisebox{-0.2\height}\faLinkedin\ \underline{linkedin.com/in/tanishq-bhosale}} ~
    \href{https://github.com/TanishqBhosale}{\raisebox{-0.2\height}\faGithub\ \underline{github.com/TanishqBhosale}}
\end{center}

\section{Professional Summary}
\begin{itemize}[leftmargin=0in, label={}]
\item Backend Engineer with 2+ years of experience building scalable backend systems, real-time APIs, and AI-powered applications using FastAPI, PostgreSQL, and AWS.
\end{itemize}

\section{Experience}
\resumeSubHeadingListStart

\resumeSubheading{Tap Academy}{March 2025 -- Present}{Full Stack Engineer}{Bangalore, Karnataka}
\resumeItemListStart
  \resumeItem{Built production LLM-powered AI code assistance using OpenAI APIs with optimized prompt engineering, token management, and SSE streaming.}
  \resumeItem{Architected full-stack learning platform with React + FastAPI/Node.js, integrating AI-driven feedback loops.}
  \resumeItem{Optimized PostgreSQL and MongoDB queries, reducing average API response time by 35\%.}
\resumeItemListEnd

\resumeSubheading{Quanta}{July 2024 -- Feb 2025}{Software Development Engineer 1}{Bangalore, Karnataka}
\resumeItemListStart
  \resumeItem{Built scalable async FastAPI and Flask microservices for real-time synchronization and low-latency collaboration.}
  \resumeItem{Designed production-grade MySQL schemas and integrated third-party APIs for scalable backend workloads.}
\resumeItemListEnd

\resumeSubHeadingListEnd

\section{Skills}
\begin{itemize}[leftmargin=1em,noitemsep]
\item \textbf{AI/ML} \quad LangGraph, LangChain, LLM Integration, RAG, pgvector, Prompt Engineering
\item \textbf{Languages} \quad Python, JavaScript, TypeScript
\item \textbf{Backend} \quad FastAPI, Node.js, Flask, Prisma
\item \textbf{Databases} \quad PostgreSQL, MongoDB, MySQL, pgvector
\end{itemize}

\section{Education}
\resumeSubHeadingListStart
\resumeSubheading{PRESIDENCY UNIVERSITY}{2020--2024}{B.Tech Computer Science \& Engineering (Data Science) -- CGPA 7.95}{Bangalore, Karnataka}
\resumeSubHeadingListEnd

\end{document}
`
