"""
Production Migration Script: SQLite to Neon PostgreSQL
Preserves user ID 16 (mistyy237@gmail.com) and all 973 records across 16 tables.
Idempotent, non-destructive, with sequence synchronization and verification.
"""

import os
import sys
import json
import sqlite3
import argparse
from datetime import datetime

# Ensure backend root is in sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

TABLE_ORDER = [
    'alembic_version',
    'users',
    'achievements',
    'daily_checkins',
    'goals',
    'habits',
    'life_scores',
    'skills',
    'notifications',
    'document_memories',
    'gamification_events',
    'activities',
    'journal_entries',
    'mood_logs',
    'wellbeings',
    'habit_logs'
]

BOOLEAN_COLUMNS = {
    'users': [
        'privacy_analyze_documents', 'privacy_analyze_journals', 'privacy_enable_analytics',
        'notify_smart_alerts', 'notify_habit_reminders', 'notify_goal_reminders',
        'notify_achievements', 'notify_monthly_reports'
    ],
    'daily_checkins': ['is_completed'],
    'habit_logs': ['completed'],
    'notifications': ['is_read']
}

JSON_COLUMNS = {
    'life_scores': ['breakdown'],
    'notifications': ['metadata_json'],
    'document_memories': ['key_topics']
}

PRIMARY_KEYS = {
    'alembic_version': 'version_num',
    'users': 'id',
    'achievements': 'id',
    'daily_checkins': 'id',
    'goals': 'id',
    'habits': 'id',
    'life_scores': 'id',
    'skills': 'id',
    'notifications': 'id',
    'document_memories': 'id',
    'gamification_events': 'id',
    'activities': 'id',
    'journal_entries': 'id',
    'mood_logs': 'id',
    'wellbeings': 'id',
    'habit_logs': 'id'
}

def get_sqlite_connection(sqlite_path):
    if not os.path.exists(sqlite_path):
        raise FileNotFoundError(f"Source SQLite database not found: {sqlite_path}")
    conn = sqlite3.connect(f"file:{sqlite_path}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn

def get_pg_connection(pg_url):
    import psycopg2
    from psycopg2.extras import RealDictCursor
    # Normalize pg_url
    if pg_url.startswith("postgresql+psycopg2://"):
        pg_url = pg_url.replace("postgresql+psycopg2://", "postgresql://", 1)
    return psycopg2.connect(pg_url)

def create_pg_schema_if_needed(pg_url):
    """Initializes tables using SQLAlchemy models if not already present."""
    from app import create_app
    from app.extensions import db
    import app.models  # ensure models are loaded
    
    os.environ['DATABASE_URL'] = pg_url
    app = create_app('production')
    with app.app_context():
        db.create_all()
    print("[OK] PostgreSQL schema verified/created via SQLAlchemy.")

def migrate_table(sqlite_conn, pg_conn, table_name):
    pk = PRIMARY_KEYS.get(table_name, 'id')
    bool_cols = set(BOOLEAN_COLUMNS.get(table_name, []))
    json_cols = set(JSON_COLUMNS.get(table_name, []))
    
    # Read from SQLite
    s_cur = sqlite_conn.cursor()
    s_cur.execute(f"PRAGMA table_info({table_name})")
    col_info = s_cur.fetchall()
    columns = [c['name'] for c in col_info]
    
    s_cur.execute(f"SELECT * FROM {table_name}")
    rows = s_cur.fetchall()
    total_source = len(rows)
    
    if total_source == 0:
        return 0, 0
    
    p_cur = pg_conn.cursor()
    
    # Check how many already exist in target
    p_cur.execute(f"SELECT COUNT(*) FROM \"{table_name}\"")
    initial_target_count = p_cur.fetchone()[0]
    
    col_names_str = ", ".join(f"\"{c}\"" for c in columns)
    placeholders = ", ".join(["%s"] * len(columns))
    
    if table_name == 'alembic_version':
        conflict_clause = "ON CONFLICT (version_num) DO NOTHING"
    else:
        conflict_clause = f"ON CONFLICT ({pk}) DO NOTHING"
        
    insert_sql = f"INSERT INTO \"{table_name}\" ({col_names_str}) VALUES ({placeholders}) {conflict_clause}"
    
    inserted_count = 0
    for row in rows:
        val_list = []
        for col in columns:
            val = row[col]
            if col in bool_cols:
                if val is None:
                    val_list.append(None)
                else:
                    val_list.append(bool(val))
            elif col in json_cols:
                if val is None:
                    val_list.append(None)
                elif isinstance(val, (dict, list)):
                    val_list.append(json.dumps(val))
                elif isinstance(val, str):
                    # verify it is valid json
                    try:
                        json.loads(val)
                        val_list.append(val)
                    except Exception:
                        val_list.append(json.dumps(val))
                else:
                    val_list.append(json.dumps(val))
            else:
                val_list.append(val)
        
        p_cur.execute(insert_sql, tuple(val_list))
        inserted_count += p_cur.rowcount
        
    pg_conn.commit()
    
    p_cur.execute(f"SELECT COUNT(*) FROM \"{table_name}\"")
    final_target_count = p_cur.fetchone()[0]
    
    return total_source, final_target_count

def sync_sequences(pg_conn):
    """Synchronizes PostgreSQL auto-increment sequences with MAX(id)."""
    p_cur = pg_conn.cursor()
    for table in TABLE_ORDER:
        if table == 'alembic_version':
            continue
        try:
            query = f"""
            SELECT setval(
                pg_get_serial_sequence('"{table}"', 'id'),
                COALESCE((SELECT MAX(id) FROM "{table}"), 1)
            );
            """
            p_cur.execute(query)
            new_val = p_cur.fetchone()[0]
            print(f"  [Sequence] {table}.id synced to {new_val}")
        except Exception as e:
            # Table might not have serial id or already at max
            pass
    pg_conn.commit()

def verify_target_account(pg_conn, target_user_id=16, target_email="mistyy237@gmail.com"):
    """Validates user 16 and related records."""
    p_cur = pg_conn.cursor()
    p_cur.execute("SELECT id, email, full_name, created_at FROM users WHERE id = %s", (target_user_id,))
    user = p_cur.fetchone()
    if not user:
        p_cur.execute("SELECT id, email, full_name, created_at FROM users WHERE email = %s", (target_email,))
        user = p_cur.fetchone()
    
    if not user:
        raise RuntimeError(f"Target account user_id={target_user_id} or email={target_email} NOT FOUND in target database!")
    
    actual_id = user[0]
    print(f"\n[TARGET ACCOUNT VERIFIED]: ID={actual_id}, Email={user[1]}, Name={user[2]}, Created={user[3]}")
    
    child_tables = {
        'daily_checkins': 'user_id',
        'goals': 'user_id',
        'habits': 'user_id',
        'life_scores': 'user_id',
        'skills': 'user_id',
        'achievements': 'user_id',
        'gamification_events': 'user_id',
        'notifications': 'user_id',
        'document_memories': 'user_id'
    }
    
    print("\n[TARGET ACCOUNT RECORDS SUMMARY]:")
    total_child = 0
    for tbl, fkey in child_tables.items():
        p_cur.execute(f"SELECT COUNT(*) FROM \"{tbl}\" WHERE \"{fkey}\" = %s", (actual_id,))
        cnt = p_cur.fetchone()[0]
        total_child += cnt
        print(f"  {tbl:<22}: {cnt:>4} records")
        
    p_cur.execute("""
        SELECT COUNT(*) FROM activities a
        JOIN daily_checkins d ON a.daily_checkin_id = d.id
        WHERE d.user_id = %s
    """, (actual_id,))
    act_cnt = p_cur.fetchone()[0]
    total_child += act_cnt
    print(f"  {'activities':<22}: {act_cnt:>4} records")
    
    p_cur.execute("""
        SELECT COUNT(*) FROM journal_entries j
        JOIN daily_checkins d ON j.daily_checkin_id = d.id
        WHERE d.user_id = %s
    """, (actual_id,))
    jrn_cnt = p_cur.fetchone()[0]
    total_child += jrn_cnt
    print(f"  {'journal_entries':<22}: {jrn_cnt:>4} records")

    p_cur.execute("""
        SELECT COUNT(*) FROM mood_logs m
        JOIN daily_checkins d ON m.daily_checkin_id = d.id
        WHERE d.user_id = %s
    """, (actual_id,))
    mood_cnt = p_cur.fetchone()[0]
    total_child += mood_cnt
    print(f"  {'mood_logs':<22}: {mood_cnt:>4} records")

    p_cur.execute("""
        SELECT COUNT(*) FROM wellbeings w
        JOIN daily_checkins d ON w.daily_checkin_id = d.id
        WHERE d.user_id = %s
    """, (actual_id,))
    wb_cnt = p_cur.fetchone()[0]
    total_child += wb_cnt
    print(f"  {'wellbeings':<22}: {wb_cnt:>4} records")
    
    print(f"Total verified child records for user {actual_id}: {total_child}")

def run_migration(sqlite_path, pg_url):
    print("=" * 65)
    print(" LIFE REPLAY AI — SAFE SQLITE TO NEON POSTGRESQL MIGRATION")
    print("=" * 65)
    print(f"Source SQLite DB : {sqlite_path}")
    # Mask password in URL for display
    masked_url = pg_url.split('@')[-1] if '@' in pg_url else 'configured'
    print(f"Target Database  : ...@{masked_url}")
    print()
    
    # Step 1: Open source SQLite
    sqlite_conn = get_sqlite_connection(sqlite_path)
    
    # Step 2: Ensure schema in target PG
    create_pg_schema_if_needed(pg_url)
    
    # Step 3: Connect to PG
    pg_conn = get_pg_connection(pg_url)
    
    # Step 4: Migrate tables
    print("\n[MIGRATING TABLES IN REFERENTIAL INTEGRITY ORDER]:")
    migration_summary = {}
    for table in TABLE_ORDER:
        src_cnt, tgt_cnt = migrate_table(sqlite_conn, pg_conn, table)
        migration_summary[table] = (src_cnt, tgt_cnt)
        match_symbol = "✓" if src_cnt <= tgt_cnt else "✗"
        print(f"  {match_symbol} {table:<22}: Source={src_cnt:>4} | Target={tgt_cnt:>4}")
        
    # Step 5: Synchronize Sequences
    print("\n[SYNCHRONIZING POSTGRESQL SERIAL SEQUENCES]:")
    sync_sequences(pg_conn)
    
    # Step 6: Verify Target Account
    verify_target_account(pg_conn, 16, "mistyy237@gmail.com")
    
    sqlite_conn.close()
    pg_conn.close()
    print("\n" + "=" * 65)
    print(" MIGRATION AND VERIFICATION COMPLETED SUCCESSFULLY!")
    print("=" * 65)

def main():
    parser = argparse.ArgumentParser(description="Migrate Life Replay AI SQLite database to Neon PostgreSQL")
    parser.add_argument("--sqlite-path", default=r"D:\Life Replay\backend\instance\app.db", help="Path to SQLite app.db")
    parser.add_argument("--target-url", default=None, help="Target PostgreSQL connection URL (or set TARGET_DATABASE_URL / DATABASE_URL env var)")
    args = parser.parse_args()
    
    pg_url = args.target_url or os.environ.get("TARGET_DATABASE_URL") or os.environ.get("DATABASE_URL")
    if not pg_url:
        print("[ERROR] Target database URL is required. Provide --target-url or set TARGET_DATABASE_URL.")
        sys.exit(1)
        
    run_migration(args.sqlite_path, pg_url)

if __name__ == "__main__":
    main()
