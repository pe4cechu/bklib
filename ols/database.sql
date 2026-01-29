ALTER SESSION SET container = CDB$ROOT; 

CREATE PLUGGABLE DATABASE LIBRARY1_PDB
ADMIN USER library1_admin IDENTIFIED BY 1234
ROLES = (DBA)
DEFAULT TABLESPACE LIBRARY1_TBS
DATAFILE '\oracle\data\library1_tbs.dbf' SIZE 100M AUTOEXTEND ON
STORAGE (MAXSIZE 2G)
FILE_NAME_CONVERT = ('\pdbseed\', '\library1_pdb\');

ALTER PLUGGABLE DATABASE LIBRARY1_PDB OPEN READ WRITE;


------------------------------------------------------------------------------- Tạo common profile -----------------------------------------------------------
ALTER SESSION SET CONTAINER = CDB$ROOT;

CREATE OR REPLACE FUNCTION C##CUSTOM_VERIFY_FUNCTION (
  username VARCHAR2,
  password VARCHAR2,
  old_password VARCHAR2
) RETURN BOOLEAN
IS
  differ INTEGER;
  has_upper BOOLEAN := FALSE;
  has_lower BOOLEAN := FALSE;
  has_digit BOOLEAN := FALSE;
  has_special BOOLEAN := FALSE;
  common_words CONSTANT VARCHAR2(4000) := 'password,123456,qwerty,admin,letmein,welcome,abc123,library,book,read,thuvien,sach';
BEGIN
  -- Check length >=12
  IF LENGTH(password) < 12 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Password must be at least 12 characters long.');
  END IF;

  -- Check not same as username
  IF LOWER(password) = LOWER(username) THEN
    RAISE_APPLICATION_ERROR(-20002, 'Password cannot be the same as username.');
  END IF;

  -- Check not reuse old password (if provided)
  IF old_password IS NOT NULL THEN
    differ := UTL_MATCH.JARO_WINKLER_SIMILARITY(old_password, password);
    IF differ > 90 THEN
      RAISE_APPLICATION_ERROR(-20003, 'New password too similar to old one.');
    END IF;
  END IF;

  -- Check mix types
  FOR i IN 1..LENGTH(password) LOOP
    IF ASCII(SUBSTR(password, i, 1)) BETWEEN ASCII('A') AND ASCII('Z') THEN has_upper := TRUE;
    ELSIF ASCII(SUBSTR(password, i, 1)) BETWEEN ASCII('a') AND ASCII('z') THEN has_lower := TRUE;
    ELSIF ASCII(SUBSTR(password, i, 1)) BETWEEN ASCII('0') AND ASCII('9') THEN has_digit := TRUE;
    ELSE has_special := TRUE;  
    END IF;
  END LOOP;

  IF NOT (has_upper AND has_lower AND has_digit AND has_special) THEN
    RAISE_APPLICATION_ERROR(-20004, 'Password must contain uppercase, lowercase, digit, and special character.');
  END IF;

  -- Avoid common words (case-insensitive check if contains)
  FOR word IN (SELECT REGEXP_SUBSTR(common_words, '[^,]+', 1, LEVEL) AS column_value FROM DUAL CONNECT BY LEVEL <= REGEXP_COUNT(common_words, ',') + 1) LOOP
    IF INSTR(LOWER(password), LOWER(word.column_value)) > 0 THEN
      RAISE_APPLICATION_ERROR(-20005, 'Password contains common word: ' || word.column_value);
    END IF;
  END LOOP;

  RETURN TRUE;
END;
/

GRANT EXECUTE ON C##CUSTOM_VERIFY_FUNCTION TO PUBLIC CONTAINER=ALL;

CREATE PROFILE C##LIBRARY_PROFILE LIMIT
  PASSWORD_VERIFY_FUNCTION C##CUSTOM_VERIFY_FUNCTION
  PASSWORD_LIFE_TIME 90
  PASSWORD_GRACE_TIME 7 
  PASSWORD_REUSE_TIME 365
  PASSWORD_REUSE_MAX 10
  FAILED_LOGIN_ATTEMPTS 5
  PASSWORD_LOCK_TIME 1
  IDLE_TIME 30 
  SESSIONS_PER_USER 5  
CONTAINER=ALL;

------------------------------------------------------------------ Tạo Các Schema/User Trong PDB ----------------------------------------------

  ALTER SESSION SET CONTAINER = LIBRARY1_PDB;

  CREATE USER book_schema IDENTIFIED BY Pass_bschema123 PROFILE C##LIBRARY_PROFILE;
  GRANT CREATE TABLE, CREATE SEQUENCE, UNLIMITED TABLESPACE, CREATE SESSION TO book_schema;

  CREATE USER member_schema IDENTIFIED BY Pass_memberschema123 PROFILE C##LIBRARY_PROFILE;
  GRANT CREATE TABLE, CREATE SEQUENCE, UNLIMITED TABLESPACE, CREATE SESSION  TO member_schema;

  CREATE USER employee_schema IDENTIFIED BY Pass_employee123 PROFILE C##LIBRARY_PROFILE;
  GRANT CREATE TABLE, CREATE SEQUENCE, UNLIMITED TABLESPACE, CREATE SESSION  TO employee_schema;

  CREATE USER admin_schema IDENTIFIED BY Pass_admschema123 PROFILE C##LIBRARY_PROFILE;
  GRANT CREATE PROCEDURE, CREATE TRIGGER, DBA, CREATE SESSION, CREATE SYNONYM TO admin_schema;  

------------------------------------------------------- Tạo Tables và Insert Dữ liệu Mẫu ----------------------------------------------------


CONNECT book_schema/Pass_bschema123@localhost:1521/LIBRARY1_PDB;

CREATE SEQUENCE book_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE copy_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE inventory_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE books (
  book_id NUMBER PRIMARY KEY,
  title VARCHAR2(200),
  author VARCHAR2(100),
  isbn VARCHAR2(20) UNIQUE,
  genre VARCHAR2(100),
  publisher VARCHAR2(100),
  book_type VARCHAR2(20) CHECK (book_type IN ('GIAOKHOA', 'LUANVAN', 'LUANAN', 'GIAODAY')),
  department VARCHAR2(20) CHECK (department IN ('CSE', 'ME')),  -- Thêm group/department
  publication_date DATE
);

CREATE TABLE book_copies (
  copy_id NUMBER PRIMARY KEY,
  book_id NUMBER REFERENCES books(book_id),
  status VARCHAR2(50),
  due_date DATE
);

CREATE TABLE inventory (
  inventory_id NUMBER PRIMARY KEY,
  book_id NUMBER REFERENCES books(book_id),
  quantity NUMBER,
  date_added DATE
);

-- Insert data mẫu vào books (gán ols_label dựa trên book_type và department, dùng char_to_label từ policy 'access_book')
INSERT INTO books (book_id, title, author, isbn, genre, publisher, book_type, department, publication_date)
VALUES (book_seq.NEXTVAL, 'Giáo khoa Công nghệ Thông tin', 'Tác giả A', 'ISBN001', 'Khoa học', 'NXB1', 'GIAOKHOA', 'CSE', SYSDATE);

INSERT INTO books (book_id, title, author, isbn, genre, publisher, book_type, department, publication_date)
VALUES (book_seq.NEXTVAL, 'Luận án Cơ khí', 'Tác giả B', 'ISBN002', 'Kỹ thuật', 'NXB2', 'LUANAN', 'ME', SYSDATE);

INSERT INTO books (book_id, title, author, isbn, genre, publisher, book_type, department, publication_date)
VALUES (book_seq.NEXTVAL, 'Luận văn Công nghệ Thông tin', 'Tác giả C', 'ISBN003', 'Khoa học', 'NXB3', 'LUANVAN', 'CSE', SYSDATE);

INSERT INTO books (book_id, title, author, isbn, genre, publisher, book_type, department, publication_date)
VALUES (book_seq.NEXTVAL, 'Giáo trình Giảng dạy Cơ khí', 'Tác giả D', 'ISBN004', 'Giáo dục', 'NXB4', 'GIAODAY', 'ME', SYSDATE);

COMMIT;

-- Connect member_schema và tạo tables liên quan đến thành viên (thêm department)
CONNECT member_schema/Pass_memberschema123@localhost:1521/LIBRARY1_PDB;

CREATE SEQUENCE member_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE checkout_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE fine_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE members (
  member_id NUMBER PRIMARY KEY,
  first_name VARCHAR2(50),
  last_name VARCHAR2(50),
  phone_number VARCHAR2(20),
  email VARCHAR2(100),
  member_type VARCHAR2(20) CHECK (member_type IN ('SINHVIEN', 'THACSI', 'TIENSI', 'GIANGVIEN')),
  department VARCHAR2(20) CHECK (department IN ('CSE', 'ME')),  -- Thêm group/department
  address VARCHAR2(200),
  membership_expiration_date DATE,
  password VARCHAR2(255) NOT NULL
);

CREATE TABLE checkouts (
  checkout_id NUMBER PRIMARY KEY,
  copy_id NUMBER, -- REFERENCES sau khi GRANT
  member_id NUMBER REFERENCES members(member_id),
  checkout_date DATE,
  due_date DATE,
  return_date DATE
);

CREATE TABLE fines (
  fine_id NUMBER PRIMARY KEY,
  checkout_id NUMBER REFERENCES checkouts(checkout_id),
  amount NUMBER,
  fine_date DATE,
  status VARCHAR2(50)
);

-- Insert data mẫu vào members (department để gán user label OLS sau)
INSERT INTO members (member_id, first_name, last_name, phone_number, email, member_type, department, address, membership_expiration_date, password)
VALUES (member_seq.NEXTVAL, 'Nguyễn', 'Văn A', '0123456789', 'sv_cse@example.com', 'SINHVIEN', 'CSE', 'HCM', SYSDATE + 365, 'hashed_pass1');

INSERT INTO members (member_id, first_name, last_name, phone_number, email, member_type, department, address, membership_expiration_date, password)
VALUES (member_seq.NEXTVAL, 'Trần', 'Thị B', '0987654321', 'ths_me@example.com', 'THACSI', 'ME', 'HCM', SYSDATE + 365, 'hashed_pass2');

INSERT INTO members (member_id, first_name, last_name, phone_number, email, member_type, department, address, membership_expiration_date, password)
VALUES (member_seq.NEXTVAL, 'Lê', 'Văn C', '0112233445', 'ts_cse@example.com', 'TIENSI', 'CSE', 'HCM', SYSDATE + 365, 'hashed_pass3');

INSERT INTO members (member_id, first_name, last_name, phone_number, email, member_type, department, address, membership_expiration_date, password)
VALUES (member_seq.NEXTVAL, 'Phạm', 'Thị D', '0556677889', 'gv_me@example.com', 'GIANGVIEN', 'ME', 'HCM', SYSDATE + 365, 'hashed_pass4');

COMMIT;

-- Connect employee_schema và tạo tables liên quan đến nhân viên (không cần thêm group ở đây, trừ khi bạn muốn)
CONNECT employee_schema/Pass_employee123@localhost:1521/LIBRARY1_PDB;

CREATE SEQUENCE employee_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE role_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE job_roles (
  role_id NUMBER PRIMARY KEY,
  role_name VARCHAR2(50),
  salary NUMBER
);

CREATE TABLE employees (
  employee_id NUMBER PRIMARY KEY,
  first_name VARCHAR2(50),
  last_name VARCHAR2(50),
  phone_number VARCHAR2(20),
  email VARCHAR2(100),
  address VARCHAR2(200),
  date_of_hire DATE,
  role_id NUMBER REFERENCES job_roles(role_id)
);
-- Inserts cho employee_schema
CONNECT employee_schema/Pass_employee123@localhost:1521/LIBRARY1_PDB;

INSERT INTO job_roles (role_id, role_name, salary) VALUES (role_seq.NEXTVAL, 'Staff', 10000000);
INSERT INTO job_roles (role_id, role_name, salary) VALUES (role_seq.NEXTVAL, 'Staff', 20000000);
INSERT INTO job_roles (role_id, role_name, salary) VALUES (role_seq.NEXTVAL, 'Staff', 12000000);
INSERT INTO job_roles (role_id, role_name, salary) VALUES (role_seq.NEXTVAL, 'Staff', 8000000);
INSERT INTO job_roles (role_id, role_name, salary) VALUES (role_seq.NEXTVAL, 'Manager', 15000000);

INSERT INTO employees (employee_id, first_name, last_name, phone_number, email, address, date_of_hire, role_id) VALUES (employee_seq.NEXTVAL, 'Hoàng', 'Văn P', '0123456780', 'p@example.com', 'Hanoi', TO_DATE('2020-01-01', 'YYYY-MM-DD'), 1);
INSERT INTO employees (employee_id, first_name, last_name, phone_number, email, address, date_of_hire, role_id) VALUES (employee_seq.NEXTVAL, 'Ngô', 'Thị Q', '0987654320', 'q@example.com', 'HCMC', TO_DATE('2021-02-01', 'YYYY-MM-DD'), 2);
INSERT INTO employees (employee_id, first_name, last_name, phone_number, email, address, date_of_hire, role_id) VALUES (employee_seq.NEXTVAL, 'Đặng', 'Văn R', '0112233440', 'r@example.com', 'Da Nang', TO_DATE('2022-03-01', 'YYYY-MM-DD'), 3);
INSERT INTO employees (employee_id, first_name, last_name, phone_number, email, address, date_of_hire, role_id) VALUES (employee_seq.NEXTVAL, 'Bùi', 'Thị S', '0556677880', 's@example.com', 'Hue', TO_DATE('2023-04-01', 'YYYY-MM-DD'), 4);
INSERT INTO employees (employee_id, first_name, last_name, phone_number, email, address, date_of_hire, role_id) VALUES (employee_seq.NEXTVAL, 'Lý', 'Văn T', '0998877660', 't@example.com', 'Can Tho', TO_DATE('2024-05-01', 'YYYY-MM-DD'), 5);

COMMIT;

------------------------------------------------------------------------- Thiết kế lại OLS -------------------------------------------------------------
CONNECT sys AS sysdba;
ALTER SESSION SET CONTAINER = LIBRARY1_PDB;
-- 
EXEC LBACSYS.CONFIGURE_OLS;

EXEC LBACSYS.OLS_ENFORCEMENT.ENABLE_OLS;

SELECT * FROM DBA_OLS_STATUS;


ALTER USER LIBRARY1_ADMIN ACCOUNT UNLOCK;

GRANT LBAC_DBA TO LIBRARY1_ADMIN;

ALTER SESSION SET NLS_NUMERIC_CHARACTERS = '.,';

GRANT connect, create user, drop user, 
create role, drop any role 
TO library1_admin IDENTIFIED BY 1234; 


BEGIN
  sa_sysdba.create_policy (
    policy_name => 'access_book',
    column_name => 'ols_book_column'
  );
END;
/

-- 
GRANT access_book_dba TO library1_admin;
CONNECT library1_admin/1234@localhost:1521/LIBRARY1_PDB;

BEGIN
  sa_components.create_level(
    policy_name => 'access_book',
    level_num => 1000,
    short_name => 'SV',
    long_name => 'SINHVIEN'
  );
END;
/

BEGIN
  sa_components.create_level(policy_name => 'access_book', level_num => 2000, short_name => 'THS', long_name => 'THACSI');   
  sa_components.create_level(policy_name => 'access_book', level_num => 3000, short_name => 'TS', long_name => 'TIENSI');  
  sa_components.create_level(policy_name => 'access_book', level_num => 4000, short_name => 'GV', long_name => 'GIANGVIEN'); 
END;
/


BEGIN
  sa_components.create_compartment('access_book', 10, 'GK', 'GIAOKHOA');
  sa_components.create_compartment('access_book', 20, 'LA', 'LUANAN');
  sa_components.create_compartment('access_book', 30, 'LV', 'LUANVAN');
  sa_components.create_compartment('access_book', 40, 'GD', 'GIAODAY');
END;
/


BEGIN
  sa_components.create_group('access_book', 100, 'CSE', 'CONG_NGHE_THONG_TIN', NULL);
  sa_components.create_group('access_book', 200, 'ME', 'CO_KHI', NULL);
END;
/

BEGIN
    sa_label_admin.create_label('access_book', 11001, 'SV:GK:CSE');

    
    sa_label_admin.create_label('access_book', 11002, 'SV:GK:ME');
    
    sa_label_admin.create_label('access_book', 21001, 'THS:LA:CSE');
    
    sa_label_admin.create_label('access_book', 21002, 'THS:LA:ME');

    sa_label_admin.create_label('access_book', 31001, 'TS:LV:CSE');

    sa_label_admin.create_label('access_book', 31002, 'TS:LV:ME');

    sa_label_admin.create_label('access_book', 40000, 'GV:GD:CSE,ME');

END;
/
---------------------------------------------------------------- Tạo OLS-column và áp dụng chính sách OLS ------------------------------------------------
BEGIN
  sa_policy_admin.apply_table_policy (
    policy_name => 'access_book',
    schema_name => 'BOOK_SCHEMA',  
    table_name => 'BOOKS',
    table_options => 'LABEL_DEFAULT,READ_CONTROL,WRITE_CONTROL,CHECK_CONTROL,LABEL_UPDATE', 
    label_function => null, 
    predicate => NULL
  );
END;
/


-------------------------------------------------------- Nếu đã insert dữ liệu thì hãy thực hiện hàm sau -----------------------------------------------
CREATE OR REPLACE PROCEDURE update_book_labels IS
BEGIN
  FOR rec IN (
    SELECT book_id, book_type, department
    FROM book_schema.books
  ) LOOP
    DECLARE
      v_level VARCHAR2(10);
      v_comp VARCHAR2(10);
      v_group VARCHAR2(10);
      v_label VARCHAR2(200);
      v_label_tag NUMBER;
    BEGIN
      CASE rec.book_type
        WHEN 'GIAOKHOA' THEN
          v_level := 'SV'; v_comp := 'GK';
        WHEN 'LUANVAN' THEN
          v_level := 'THS'; v_comp := 'LA';
        WHEN 'LUANAN' THEN
          v_level := 'TS'; v_comp := 'LV';
        WHEN 'GIAODAY' THEN
          v_level := 'GV'; v_comp := 'GD';
      END CASE;
      
      IF rec.book_type = 'GIAODAY' THEN
        v_label := v_level || ':' || v_comp || ':' || 'CSE,ME';
      ELSE
        v_group := rec.department;
        v_label := v_level || ':' || v_comp || ':' || v_group;
      END IF;
      
      v_label_tag := CHAR_TO_LABEL('access_book', v_label);
      UPDATE book_schema.books
      SET OLS_BOOK_COLUMN = v_label_tag
      WHERE book_id = rec.book_id;
    END;
  END LOOP;
  COMMIT;
END;
/

EXEC update_book_labels;


------------------------------------------------------------------ Sau đó tạo trigger mới để điều chỉnh mỗi khi insert sách mới -------------------------------------------------
CREATE OR REPLACE TRIGGER book_schema.update_book_labels_trg
BEFORE INSERT OR UPDATE ON book_schema.books
FOR EACH ROW
DECLARE
  v_level     VARCHAR2(10);
  v_comp      VARCHAR2(10);
  v_group     VARCHAR2(100);  
  v_label     VARCHAR2(200);
BEGIN
  CASE UPPER(:new.book_type)  -
    WHEN 'GIAOKHOA' THEN
      v_level := 'SV'; v_comp := 'GK';
    WHEN 'LUANVAN' THEN
      v_level := 'THS'; v_comp := 'LA';
    WHEN 'LUANAN' THEN
      v_level := 'TS'; v_comp := 'LV';
    WHEN 'GIAODAY' THEN
      v_level := 'GV'; v_comp := 'GD';
    ELSE
      RAISE_APPLICATION_ERROR(-20001, 'Loại sách không hợp lệ: ' || :new.book_type);
  END CASE;

  IF UPPER(:new.book_type) = 'GIAODAY' THEN
    v_group := 'CSE,ME';
  ELSE
    IF UPPER(:new.department) NOT IN ('CSE', 'ME') THEN
      RAISE_APPLICATION_ERROR(-20002, 'Department không hợp lệ: ' || :new.department);
    END IF;
    v_group := UPPER(:new.department);
  END IF;

  v_label := v_level || ':' || v_comp || ':' || v_group;

  :new.OLS_BOOK_COLUMN := CHAR_TO_LABEL('access_book', v_label);

EXCEPTION
  WHEN OTHERS THEN
    RAISE_APPLICATION_ERROR(-20003, 'Lỗi khi tạo label: ' || SQLERRM);
END;
/

CREATE OR REPLACE PACKAGE user_ols_manager AS
  PROCEDURE create_and_assign_ols_user(
    p_username VARCHAR2,
    p_password VARCHAR2,
    p_level VARCHAR2,  
    p_dept VARCHAR2 DEFAULT NULL 
  );
END user_ols_manager;
/

CREATE OR REPLACE PACKAGE BODY user_ols_manager AS
  PROCEDURE create_and_assign_ols_user(
    p_username VARCHAR2,
    p_password VARCHAR2,
    p_level VARCHAR2,
    p_dept VARCHAR2 DEFAULT NULL
  ) IS
    v_policy_name CONSTANT VARCHAR2(30) := 'access_book';
    v_max_level VARCHAR2(10);
    v_min_level VARCHAR2(10);
    v_def_level VARCHAR2(10);
    v_row_level VARCHAR2(10);
    
    v_read_comps VARCHAR2(100);
    v_write_comps VARCHAR2(100);
    v_def_comps VARCHAR2(100);
    v_row_comps VARCHAR2(100);
    
    v_read_groups VARCHAR2(100);
    v_write_groups VARCHAR2(100);
    v_def_groups VARCHAR2(100);
    v_row_groups VARCHAR2(100);
    
    v_privs VARCHAR2(100) := NULL;  
  BEGIN
    IF UPPER(p_level) NOT IN ('SV', 'THS', 'TS', 'GV') THEN
      RAISE_APPLICATION_ERROR(-20001, 'Level không hợp lệ: ' || p_level);
    END IF;
    
    BEGIN
      EXECUTE IMMEDIATE 'CREATE USER ' || UPPER(p_username) || ' IDENTIFIED BY ' || p_password;
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLCODE = -1920 THEN  
          DBMS_OUTPUT.PUT_LINE('User ' || p_username || ' đã tồn tại, skip tạo mới.');
        ELSE
          RAISE;
        END IF;
    END;
    
    EXECUTE IMMEDIATE 'GRANT CONNECT, RESOURCE TO ' || UPPER(p_username);
    
    CASE UPPER(p_level)
      WHEN 'SV' THEN
        v_max_level := 'SV';
        v_min_level := 'SV';
        v_def_level := 'SV';
        v_row_level := 'SV';
        
        v_read_comps := 'GK';
        v_write_comps := 'GK';  -
        v_def_comps := 'GK';
        v_row_comps := 'GK';
        
      WHEN 'THS' THEN
        v_max_level := 'THS';
        v_min_level := 'SV';  
        v_def_level := 'THS';
        v_row_level := 'THS';
        
        v_read_comps := 'GK,LA';
        v_write_comps := 'LA';  
        v_def_comps := 'GK,LA';
        v_row_comps := 'LA';
        
      WHEN 'TS' THEN
        v_max_level := 'TS';
        v_min_level := 'SV';  
        v_def_level := 'TS';
        v_row_level := 'TS';
        
        v_read_comps := 'GK,LA,LV';
        v_write_comps := 'LV'; 
        v_def_comps := 'GK,LA,LV';
        v_row_comps := 'LV';
        
      WHEN 'GV' THEN
        v_max_level := 'GV';
        v_min_level := 'SV'; 
        v_def_level := 'GV';
        v_row_level := 'GV';
        
        v_read_comps := 'GK,LA,LV,GD';
        v_write_comps := 'GK,LA,LV,GD';  
        v_def_comps := 'GK,LA,LV,GD';
        v_row_comps := 'GK,LA,LV,GD';
        
        v_privs := 'WRITEDOWN,WRITEACROSS,WRITEUP';  
        
    END CASE;
    
    IF UPPER(p_level) = 'GV' THEN
      v_read_groups := 'CSE,ME';
      v_write_groups := 'CSE,ME';
      v_def_groups := 'CSE,ME';
      v_row_groups := 'CSE,ME';
    ELSE
      IF p_dept IS NULL OR UPPER(p_dept) NOT IN ('CSE', 'ME') THEN
        RAISE_APPLICATION_ERROR(-20002, 'Department bắt buộc và hợp lệ cho non-GV: ' || p_dept);
      END IF;
      v_read_groups := UPPER(p_dept);
      v_write_groups := UPPER(p_dept);
      v_def_groups := UPPER(p_dept);
      v_row_groups := UPPER(p_dept);
    END IF;
    
    sa_user_admin.set_levels(
      policy_name => v_policy_name,
      user_name   => UPPER(p_username),
      max_level   => v_max_level,
      min_level   => v_min_level,
      def_level   => v_def_level,
      row_level   => v_row_level
    );
    
    sa_user_admin.set_compartments(
      policy_name => v_policy_name,
      user_name   => UPPER(p_username),
      read_comps  => v_read_comps,
      write_comps => v_write_comps,
      def_comps   => v_def_comps,
      row_comps   => v_row_comps
    );
    
    sa_user_admin.set_groups(
      policy_name  => v_policy_name,
      user_name    => UPPER(p_username),
      read_groups  => v_read_groups,
      write_groups => v_write_groups,
      def_groups   => v_def_groups,
      row_groups   => v_row_groups
    );
    
    IF v_privs IS NOT NULL THEN
      sa_user_admin.set_user_privs(
        policy_name => v_policy_name,
        user_name   => UPPER(p_username),
        privileges  => v_privs
      );
    END IF;
    
    DBMS_OUTPUT.PUT_LINE('Tạo và gán OLS thành công cho user: ' || p_username || ' (level: ' || p_level || ', dept: ' || NVL(p_dept, 'All for GV') || ')');
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20003, 'Lỗi tạo/gán user: ' || SQLERRM);
  END create_and_assign_ols_user;
END user_ols_manager;
/

EXEC user_ols_manager.create_and_assign_ols_user('USER_SV_CSE', '123', 'SV', 'CSE');
EXEC user_ols_manager.create_and_assign_ols_user('USER_SV_ME', '123', 'SV', 'ME');
EXEC user_ols_manager.create_and_assign_ols_user('USER_THS_CSE', '123', 'THS', 'CSE');
EXEC user_ols_manager.create_and_assign_ols_user('USER_THS_ME', '123', 'THS', 'ME');
EXEC user_ols_manager.create_and_assign_ols_user('USER_TS_CSE', '123', 'TS', 'CSE');
EXEC user_ols_manager.create_and_assign_ols_user('USER_TS_ME', '123', 'TS', 'ME');
EXEC user_ols_manager.create_and_assign_ols_user('USER_GV', '123', 'GV');

------------------------------------------------------------ Cấp quyền trên Book_schema ------------------------------------------------

grant select, insert, update, delete on book_schema.books to USER_SV_CSE;
grant select, insert, update, delete on book_schema.books to USER_SV_ME;  
grant select, insert, update, delete on book_schema.books to USER_THS_CSE;
grant select, insert, update, delete on book_schema.books to USER_THS_ME;
grant select, insert, update, delete on book_schema.books to USER_TS_CSE;
grant select, insert, update, delete on book_schema.books to USER_TS_ME;
grant select, insert, update, delete on book_schema.books to USER_GV;

grant select on book_schema.book_seq to USER_SV_CSE;
grant select on book_schema.book_seq to USER_SV_ME;
grant select on book_schema.book_seq to USER_THS_CSE;
grant select on book_schema.book_seq to USER_THS_ME;
grant select on book_schema.book_seq to USER_TS_CSE;
grant select on book_schema.book_seq to USER_TS_ME;
grant select on book_schema.book_seq to USER_GV;


------------------------------------------------------------ Tạo Context và Packages để quản lý login và kết nối ------------------------------------------------

CREATE CONTEXT user_ctx USING ols_auth_pkg;

CREATE OR REPLACE PACKAGE ols_auth_pkg AS
  PROCEDURE login(p_email VARCHAR2, p_password VARCHAR2);
END ols_auth_pkg;
/

CREATE OR REPLACE PACKAGE BODY ols_auth_pkg AS
  PROCEDURE login(p_email VARCHAR2, p_password VARCHAR2) IS
    v_member_type VARCHAR2(20);
    v_department VARCHAR2(20);
    v_stored_pass VARCHAR2(255);
  BEGIN
    SELECT member_type, department, password
    INTO v_member_type, v_department, v_stored_pass
    FROM member_schema.members
    WHERE LOWER(email) = LOWER(p_email);
    
    IF v_stored_pass != p_password THEN
      RAISE_APPLICATION_ERROR(-20001, 'Password sai');
    END IF;
    
    DBMS_SESSION.SET_CONTEXT('user_ctx', 'member_type', UPPER(v_member_type));
    DBMS_SESSION.SET_CONTEXT('user_ctx', 'department', UPPER(v_department));
    
    DBMS_OUTPUT.PUT_LINE('Login thành công. Member type: ' || v_member_type || ', Department: ' || v_department);
    
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE_APPLICATION_ERROR(-20002, 'Email không tồn tại');
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20003, 'Lỗi login: ' || SQLERRM);
  END login;
END ols_auth_pkg;
/

CREATE OR REPLACE PACKAGE ols_connect_pkg AS
  FUNCTION get_connect_string RETURN VARCHAR2;
END ols_connect_pkg;
/

CREATE OR REPLACE PACKAGE BODY ols_connect_pkg AS
  FUNCTION get_connect_string RETURN VARCHAR2 IS
    v_member_type VARCHAR2(20) := SYS_CONTEXT('user_ctx', 'member_type');
    v_department VARCHAR2(20) := SYS_CONTEXT('user_ctx', 'department');
    v_username VARCHAR2(30);
    v_password CONSTANT VARCHAR2(10) := '123';  -- Password chung
    v_connect_str CONSTANT VARCHAR2(50) := '@localhost:1521/LIBRARY1_PDB';
  BEGIN
    IF v_member_type IS NULL OR v_department IS NULL THEN
      RAISE_APPLICATION_ERROR(-20004, 'Context chưa set (chưa login).');
    END IF;
    
    -- Map member_type và department đến username hợp lý
    CASE UPPER(v_member_type)
      WHEN 'SINHVIEN' THEN
        v_username := 'USER_SV_' || UPPER(v_department);
        
      WHEN 'THACSI' THEN
        v_username := 'USER_THS_' || UPPER(v_department);
        
      WHEN 'TIENSI' THEN
        v_username := 'USER_TS_' || UPPER(v_department);
        
      WHEN 'GIANGVIEN' THEN
        v_username := 'USER_GV';  -- Không phụ thuộc department
        
      ELSE
        RAISE_APPLICATION_ERROR(-20005, 'Member type không hợp lệ: ' || v_member_type);
    END CASE;
    
    -- Return lệnh CONNECT đầy đủ
    RETURN 'CONNECT ' || v_username || '/' || v_password || v_connect_str || ';';
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20006, 'Lỗi lấy connect string: ' || SQLERRM);
  END get_connect_string;
END ols_connect_pkg;
/

CONNECT library1_admin/1234@localhost:1521/LIBRARY1_PDB;

EXEC ols_auth_pkg.login('sv_cse@example.com', 'hashed_pass1');

SELECT ols_connect_pkg.get_connect_string FROM dual;

SELECT book_id, title, book_type, department, TO_CHAR(ols_book_column) AS label
FROM book_schema.books
ORDER BY book_id;

CONNECT library1_admin/1234@localhost:1521/LIBRARY1_PDB;

INSERT INTO book_schema.books (book_id, title, author, isbn, genre, publisher, book_type, department, publication_date)
VALUES (book_schema.book_seq.NEXTVAL, 'Giáo khoa Công nghệ Thông tin_temp', 'Tác giả A_temp', 'ISBN001', 'Khoa học', 'NXB1', 'GIAOKHOA', 'CSE', SYSDATE);


INSERT INTO book_schema.books (book_id, title, author, isbn, genre, publisher, book_type, department, publication_date)
VALUES (book_schema.book_seq.NEXTVAL, 'Luận án Cơ khí_temp', 'Tác giả B_temp  ', 'ISBN09', 'Kỹ thuật', 'NXB2', 'LUANAN', 'ME', SYSDATE);
-- Remove policy cũ

-- BEGIN
--   sa_user_admin.set_levels(
--     policy_name => 'access_book',
--     user_name => 'USER_SV',
--     max_level => 'SV',
--     min_level => 'SV',
--     def_level => 'SV',
--     row_level => 'SV'
--   );
-- END;
-- /

-- BEGIN
--   sa_user_admin.set_compartments(
--     policy_name => 'access_book',
--     user_name => 'USER_SV',
--     read_comps => 'GK',
--     write_comps => 'GK',
--     def_comps => 'GK',
--     row_comps => 'GK'
--   );
-- END;
-- /

-- BEGIN
--   sa_user_admin.set_groups(
--     policy_name => 'access_book',
--     user_name => 'USER_SV',
--     read_groups => 'CSE,ME',
--     write_groups => 'CSE,ME',
--     def_groups => 'CSE,ME',
--     row_groups => 'CSE,ME'
--   );
-- END;
-- /

-- BEGIN
--   sa_user_admin.set_levels(
--     policy_name => 'access_book',
--     user_name => 'USER_THS',
--     max_level => 'THS',
--     min_level => 'THS',
--     def_level => 'THS',
--     row_level => 'THS'
--   );
-- END;
-- /

-- BEGIN
--   sa_user_admin.set_compartments(
--     policy_name => 'access_book',
--     user_name => 'USER_THS',
--     read_comps => 'GK,LA',
--     write_comps => 'LA',
--     def_comps => 'GK,LA',
--     row_comps => 'LA'
--   );
-- END;
-- /

-- BEGIN
--   sa_user_admin.set_groups(
--     policy_name => 'access_book',
--     user_name => 'USER_THS',
--     read_groups => 'CSE,ME',
--     write_groups => 'CSE,ME',
--     def_groups => 'CSE,ME',
--     row_groups => 'CSE,ME'
--   );
-- END;
-- /

-- BEGIN
--   sa_user_admin.set_levels(
--     policy_name => 'access_book',
--     user_name => 'USER_TS',
--     max_level => 'TS',
--     min_level => 'TS',
--     def_level => 'TS',
--     row_level => 'TS'
--   );
-- END;
-- /

-- BEGIN
--   sa_user_admin.set_compartments(
--     policy_name => 'access_book',
--     user_name => 'USER_TS',
--     read_comps => 'GK,LA,LV',
--     write_comps => 'LV',
--     def_comps => 'GK,LA,LV',
--     row_comps => 'LV'
--   );
-- END;
-- /

-- BEGIN
--   sa_user_admin.set_groups(
--     policy_name => 'access_book',
--     user_name => 'USER_TS',
--     read_groups => 'CSE,ME',
--     write_groups => 'CSE,ME',
--     def_groups => 'CSE,ME',
--     row_groups => 'CSE,ME'
--   );
-- END;
-- /

-- BEGIN
--   sa_user_admin.set_levels(
--     policy_name => 'access_book',
--     user_name => 'USER_GV',
--     max_level => 'GV',
--     min_level => 'SV',
--     def_level => 'GV',
--     row_level => 'GV'
--   );
-- END;
-- /

-- BEGIN
--   sa_user_admin.set_compartments(
--     policy_name => 'access_book',
--     user_name => 'USER_GV',
--     read_comps => 'GK,LA,LV,GD',
--     write_comps => 'GK,LA,LV,GD',
--     def_comps => 'GK,LA,LV,GD',
--     row_comps => 'GK,LA,LV,GD'
--   );
-- END;
-- /

-- BEGIN
--   sa_user_admin.set_groups(
--     policy_name => 'access_book',
--     user_name => 'USER_GV',
--     read_groups => 'CSE,ME',
--     write_groups => 'CSE,ME',
--     def_groups => 'CSE,ME',
--     row_groups => 'CSE,ME'
--   );
-- END;
-- /


-- BEGIN
--   sa_user_admin.set_user_privs('access_book', 'USER_GV', 'WRITEDOWN,WRITEACROSS,WRITEUP');
-- END;
-- /


GRANT SELECT, INSERT, UPDATE, DELETE ON book_schema.books TO USER_SV;
GRANT SELECT, INSERT, UPDATE, DELETE ON book_schema.books TO USER_THS;
GRANT SELECT, INSERT, UPDATE, DELETE ON book_schema.books TO USER_TS;
GRANT SELECT, INSERT, UPDATE, DELETE ON book_schema.books TO USER_GV;

GRANT SELECT ON book_schema.book_seq TO USER_SV;
GRANT SELECT ON book_schema.book_seq TO USER_THS;
GRANT SELECT ON book_schema.book_seq TO USER_TS;
GRANT SELECT ON book_schema.book_seq TO USER_GV;


CONNECT USER_GV/123@localhost:1521/LIBRARY1_PDB;
ALTER SESSION SET CONTAINER = LIBRARY1_PDB;

INSERT INTO book_schema.books (book_id, title, author, isbn, genre, publisher, book_type, department, publication_date, ols_book_column)
VALUES (book_schema.book_seq.NEXTVAL, 'Giao Khoa CSE', 'Author1', 'ISBN001', 'Education', 'Pub1', 'GIAOKHOA', 'CSE', SYSDATE, CHAR_TO_LABEL('access_book', 'SV:GK:CSE'));

INSERT INTO book_schema.books (book_id, title, author, isbn, genre, publisher, book_type, department, publication_date, ols_book_column)
VALUES (book_schema.book_seq.NEXTVAL, 'Luan An THS', 'Author2', 'ISBN002', 'Research', 'Pub2', 'LUANAN', 'ME', SYSDATE, CHAR_TO_LABEL('access_book', 'THS:LA:ME'));

INSERT INTO book_schema.books (book_id, title, author, isbn, genre, publisher, book_type, department, publication_date, ols_book_column)
VALUES (book_schema.book_seq.NEXTVAL, 'Luan Van TS', 'Author3', 'ISBN003', 'Thesis', 'Pub3', 'LUANVAN', 'CSE', SYSDATE, CHAR_TO_LABEL('access_book', 'TS:LV:CSE'));

INSERT INTO book_schema.books (book_id, title, author, isbn, genre, publisher, book_type, department, publication_date, ols_book_column)
VALUES (book_schema.book_seq.NEXTVAL, 'Giao Day GV', 'Author4', 'ISBN004', 'Teaching', 'Pub4', 'GIAODAY', 'ME', SYSDATE, CHAR_TO_LABEL('access_book', 'GV:GD:ME'));

COMMIT;

ALTER PLUGGABLE DATABASE LIBRARY1_PDB Close;  

DROP PLUGGABLE DATABASE LIBRARY1_PDB INCLUDING DATAFILES; 

