USE `sc_vehiculos`;
SET NAMES utf8mb4;

DELIMITER //
DROP PROCEDURE IF EXISTS `scv_repair_utf8_mojibake`//
CREATE PROCEDURE `scv_repair_utf8_mojibake`()
BEGIN
  DECLARE finished BOOLEAN DEFAULT FALSE;
  DECLARE target_table VARCHAR(64);
  DECLARE target_column VARCHAR(64);
  DECLARE text_columns CURSOR FOR
    SELECT TABLE_NAME, COLUMN_NAME
    FROM information_schema.columns
    WHERE TABLE_SCHEMA = DATABASE()
      AND DATA_TYPE IN ('char', 'varchar', 'tinytext', 'text', 'mediumtext', 'longtext')
    ORDER BY TABLE_NAME, ORDINAL_POSITION;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = TRUE;

  OPEN text_columns;

  repair_loop: LOOP
    FETCH text_columns INTO target_table, target_column;
    IF finished THEN
      LEAVE repair_loop;
    END IF;

    SET @repair_statement = CONCAT(
      'UPDATE `', REPLACE(target_table, '`', '``'), '` ',
      'SET `', REPLACE(target_column, '`', '``'), '` = ',
      'CONVERT(CAST(CONVERT(`', REPLACE(target_column, '`', '``'), '` USING latin1) AS BINARY) USING utf8mb4) ',
      'WHERE HEX(`', REPLACE(target_column, '`', '``'), '`) LIKE ''%C383%'' ',
      'OR HEX(`', REPLACE(target_column, '`', '``'), '`) LIKE ''%C382%'''
    );

    PREPARE repair_statement FROM @repair_statement;
    EXECUTE repair_statement;
    DEALLOCATE PREPARE repair_statement;
  END LOOP;

  CLOSE text_columns;
END//
DELIMITER ;

CALL `scv_repair_utf8_mojibake`();
DROP PROCEDURE `scv_repair_utf8_mojibake`;