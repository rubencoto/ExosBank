<?php

/**
 * SQL Server PHP Driver Function Stubs
 * This file provides function signatures for IDE intellisense support
 * DO NOT INCLUDE THIS FILE IN PRODUCTION CODE
 */

if (false) { // This condition ensures the functions are never actually defined

    /**
     * Opens a connection to a Microsoft SQL Server database
     * @param string $serverName
     * @param array $connectionInfo
     * @return resource|false
     */
    function sqlsrv_connect($serverName, $connectionInfo = []) {}

    /**
     * Prepares and executes a query
     * @param resource $conn
     * @param string $sql
     * @param array $params
     * @param array $options
     * @return resource|false
     */
    function sqlsrv_query($conn, $sql, $params = [], $options = []) {}

    /**
     * Prepares a query for execution
     * @param resource $conn
     * @param string $sql
     * @param array $params
     * @param array $options
     * @return resource|false
     */
    function sqlsrv_prepare($conn, $sql, $params = [], $options = []) {}

    /**
     * Executes a prepared statement
     * @param resource $stmt
     * @return bool
     */
    function sqlsrv_execute($stmt) {}

    /**
     * Returns error information about the last operation
     * @param int $errorsOrWarnings
     * @return array|null
     */
    function sqlsrv_errors($errorsOrWarnings = SQLSRV_ERR_ALL) {}

    /**
     * Makes the next row in a result set available for reading
     * @param resource $stmt
     * @param int $row
     * @param int $offset
     * @return bool
     */
    function sqlsrv_fetch($stmt, $row = SQLSRV_SCROLL_NEXT, $offset = 0) {}

    /**
     * Gets field data from the currently selected row
     * @param resource $stmt
     * @param int $fieldIndex
     * @param int $getAsType
     * @return mixed
     */
    function sqlsrv_get_field($stmt, $fieldIndex, $getAsType = SQLSRV_PHPTYPE_STRING_UTF8) {}

    /**
     * Frees all resources for the specified statement
     * @param resource $stmt
     * @return bool
     */
    function sqlsrv_free_stmt($stmt) {}

    /**
     * Closes an open connection and releases resources
     * @param resource $conn
     * @return bool
     */
    function sqlsrv_close($conn) {}

    /**
     * Returns the number of rows affected by the last statement
     * @param resource $stmt
     * @return int|false
     */
    function sqlsrv_rows_affected($stmt) {}

    /**
     * Retrieves the next row of data in a result set as an associative array
     * @param resource $stmt
     * @return array|null|false
     */
    function sqlsrv_fetch_array($stmt, $fetchType = SQLSRV_FETCH_BOTH, $row = SQLSRV_SCROLL_NEXT, $offset = 0) {}

    /**
     * Retrieves the next row of data in a result set as an object
     * @param resource $stmt
     * @param string $className
     * @param array $ctorParams
     * @param int $row
     * @param int $offset
     * @return object|false
     */
    function sqlsrv_fetch_object($stmt, $className = "stdClass", $ctorParams = [], $row = SQLSRV_SCROLL_NEXT, $offset = 0) {}

    // SQL Server constants
    define('SQLSRV_ERR_ALL', 0);
    define('SQLSRV_ERR_ERRORS', 1);
    define('SQLSRV_ERR_WARNINGS', 2);
    define('SQLSRV_FETCH_ASSOC', 2);
    define('SQLSRV_FETCH_NUMERIC', 3);
    define('SQLSRV_FETCH_BOTH', 4);
    define('SQLSRV_SCROLL_NEXT', 1);
    define('SQLSRV_PHPTYPE_STRING_UTF8', 'string');
}
