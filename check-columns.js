const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awatunmzabgagtaoiuhv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YXR1bm16YWJnYWd0YW9pdWh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NDA1NTMsImV4cCI6MjA5NDMxNjU1M30.VfPST17Gmf_n1DhGYhgfkiksEAaMJr6KL-2sISAVIBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data, error } = await supabase
      .from('todos')
      .insert([
        {
          task: 'Test task',
          due_date: '2026-05-25'
        }
      ])
      .select();
    
    console.log('Insert Result:', { data, error });
  } catch (err) {
    console.error('Exception:', err);
  }
}

check();
