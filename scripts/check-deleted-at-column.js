const { DataSource } = require('typeorm');
const path = require('path');

// Database configuration
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'sgc_itep',
  synchronize: false,
  logging: true,
});

async function checkDeletedAtColumn() {
  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    // Check if deleted_at column exists
    console.log('\n📋 Checking for deleted_at column...');
    const result = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'desarquivamentos' 
      AND column_name = 'deleted_at'
    `);

    if (result.length > 0) {
      console.log('✅ deleted_at column exists:');
      console.log(result[0]);
    } else {
      console.log('❌ deleted_at column NOT found!');
    }

    // Check all columns in desarquivamentos table
    console.log('\n📋 All columns in desarquivamentos table:');
    const allColumns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'desarquivamentos'
      ORDER BY ordinal_position
    `);

    allColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}${col.is_nullable === 'YES' ? ', nullable' : ''})`);
    });

    // Check if there are any soft-deleted records
    console.log('\n🔍 Checking for any records with deleted_at...');
    try {
      const deletedRecords = await dataSource.query(`
        SELECT id, deleted_at 
        FROM desarquivamentos 
        WHERE deleted_at IS NOT NULL
        LIMIT 5
      `);

      if (deletedRecords.length > 0) {
        console.log(`✅ Found ${deletedRecords.length} soft-deleted records:`);
        deletedRecords.forEach(record => {
          console.log(`  - ID: ${record.id}, deleted_at: ${record.deleted_at}`);
        });
      } else {
        console.log('📝 No soft-deleted records found');
      }
    } catch (error) {
      console.error('❌ Error checking deleted records:', error.message);
    }

    // Check total records vs non-deleted records
    console.log('\n📊 Record counts:');
    const totalCount = await dataSource.query('SELECT COUNT(*) as count FROM desarquivamentos');
    console.log(`  - Total records: ${totalCount[0].count}`);

    try {
      const activeCount = await dataSource.query('SELECT COUNT(*) as count FROM desarquivamentos WHERE deleted_at IS NULL');
      console.log(`  - Active records: ${activeCount[0].count}`);
      console.log(`  - Deleted records: ${totalCount[0].count - activeCount[0].count}`);
    } catch (error) {
      console.log('  - Cannot count by deleted_at (column might not exist)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the check
checkDeletedAtColumn();