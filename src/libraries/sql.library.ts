import mysql from 'mysql';
export class SQLLibrary {
	sqlConnection: mysql.Pool;
	setSQL(sql: mysql.Pool) {
		this.sqlConnection = sql;
		this.onSqlSet();
	}

	onSqlSet() {}
}
