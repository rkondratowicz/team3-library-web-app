 CREATE TABLE members (
       ID TEXT PRIMARY KEY,
       memberName VARCHAR(255) NOT NULL,
       email VARCHAR(255) UNIQUE NOT NULL,
       phone VARCHAR(20),
       memAddress TEXT
   );