CREATE TABLE dzialy (
id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL UNIQUE
);

CREATE TABLE users (
id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
email TEXT NOT NULL,
password TEXT NOT NULL,
first_name TEXT NOT NULL,
last_name TEXT NOT NULL,
role_id INTEGER NOT NULL,
fired BOOLEAN NOT NULL,
session_cookie TEXT,
FOREIGN KEY(role_id) REFERENCES roles(id)
);

CREATE TABLE roles (
id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL
);

INSERT INTO roles VALUES(1,'admin');
INSERT INTO roles VALUES(2,'kadry');
INSERT INTO roles VALUES(3,'menedżer');
INSERT INTO roles VALUES(4,'pracownik');

CREATE TABLE users_dzialy(
user_id INTEGER NOT NULL,
dzial_id INTEGER NOT NULL,
foreign key(user_id) references users(id),
foreign key(dzial_id) references dzialy(id)
);

CREATE TABLE projects(
id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL UNIQUE,
end_date TEXT
);

CREATE TABLE project_users(
user_id INTEGER NOT NULL,
project_id INTEGER NOT NULL,
foreign key(user_id) references users(id),
foreign key(project_id) references projects(id)
);

CREATE TABLE userWorkDetails(
project_id INTEGER NOT NULL,
user_id INTEGER NOT NULL,
workDate REAL NOT NULL,
workMode TEXT NOT NULL,
workTime INTEGER NOT NULL,
activity TEXT,
task TEXT,
foreign key(user_id) references users(id),
foreign key(project_id) references projects(id)
);
