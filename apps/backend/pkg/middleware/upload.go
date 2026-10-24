package middleware

// MaxMultipartMemory is how much of a multipart form is kept in memory;
// larger uploads spill to temp files in os.TempDir() (removed after the
// request). Kept small so a few concurrent uploads cannot exhaust memory.
const MaxMultipartMemory = 8 << 20
