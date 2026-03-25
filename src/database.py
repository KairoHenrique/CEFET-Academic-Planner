import sqlite3
import os

class DatabaseManager:
    def __init__(self, db_name="cefet_planner.db"):
        self.db_path = os.path.join(os.path.dirname(__file__), '..', 'data', db_name)
        self._garantir_diretorio()

    def _garantir_diretorio(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

    def conectar(self):
        # Retorna a conexao ativa com o banco de dados
        return sqlite3.connect(self.db_path)

    def criar_tabelas(self):
        conn = self.conectar()
        cursor = conn.cursor()
        # Tabela de Disciplinas
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS disciplinas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT UNIQUE NOT NULL,
            nome TEXT NOT NULL,
            tipo TEXT NOT NULL, -- 'Obrigatoria', 'Optativa', 'Extensao'
            carga_horaria INTEGER NOT NULL,
            periodo INTEGER -- 1 a 10 (0 para Extensao/Optativa livre)
        )
        """)

        # Tabela de Pre-requisitos
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS requisitos (
            disciplina_id INTEGER,
            requisito_id INTEGER,
            PRIMARY KEY (disciplina_id, requisito_id),
            FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
            FOREIGN KEY (requisito_id) REFERENCES disciplinas(id)
        )
        """)

        # Tabela de Historico do Aluno
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            disciplina_id INTEGER,
            status TEXT NOT NULL, -- 'Concluida', 'Cursando'
            nota REAL,
            FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id)
        )
        """)

        conn.commit()
        conn.close()
        print("Banco de dados funfando")

if __name__ == "__main__":
    db = DatabaseManager()
    db.criar_tabelas()