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

    # Adiciona uma disciplina ao banco
    def adicionar_disciplina(self, codigo, nome, tipo, carga_horaria, periodo):
        conn = self.conectar()
        cursor = conn.cursor()
        try:
            cursor.execute("""
            INSERT INTO disciplinas (codigo, nome, tipo, carga_horaria, periodo)
            VALUES (?, ?, ?, ?, ?)
            """, (codigo, nome, tipo, carga_horaria, periodo))
            conn.commit()
            print(f"Disciplina {codigo} ({nome}) inserida com sucesso.")
        except sqlite3.IntegrityError:
            print(f"O codigo {codigo} ja esta cadastrado no banco.")
        finally:
            conn.close()

    def adicionar_requisito(self, codigo_disciplina, codigo_requisito):
        conn = self.conectar()
        cursor = conn.cursor()
        
        # Buscam os IDs das disciplinas usando os codigos
        cursor.execute("SELECT id FROM disciplinas WHERE codigo = ?", (codigo_disciplina,))
        res_disc = cursor.fetchone()
        
        cursor.execute("SELECT id FROM disciplinas WHERE codigo = ?", (codigo_requisito,))
        res_req = cursor.fetchone()
        
        if res_disc and res_req:
            try:
                cursor.execute("""
                INSERT INTO requisitos (disciplina_id, requisito_id)
                VALUES (?, ?)
                """, (res_disc[0], res_req[0]))
                conn.commit()
                print(f"Requisito adicionado: {codigo_requisito} tranca {codigo_disciplina}.")
            except sqlite3.IntegrityError:
                print("Aviso: Esse pre-requisito ja existe.")
        else:
            print("Erro!! Uma das disciplinas nao foi encontrada no banco.")
            
        conn.close()

if __name__ == "__main__":
    db = DatabaseManager()
    db.criar_tabelas()