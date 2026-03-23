require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 获取所有分类
app.get('/api/genres', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT genre FROM story_status WHERE is_active = true AND genre IS NOT NULL
    `);
    const genres = result.rows.map(row => row.genre);
    res.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

// 获取小说列表
app.get('/api/stories', async (req, res) => {
  try {
    const { genre, search, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        s.id as story_id,
        s.title,
        s.genre,
        s.style,
        s.target_word_count,
        s.current_word_count,
        s.current_chapter,
        s.is_active,
        s.created_at,
        (
          SELECT c.title
          FROM chapters c
          WHERE c.story_id = s.story_id
          ORDER BY c.chapter_number DESC
          LIMIT 1
        ) as latest_chapter,
        (
          SELECT c.chapter_number
          FROM chapters c
          WHERE c.story_id = s.story_id
          ORDER BY c.chapter_number DESC
          LIMIT 1
        ) as latest_chapter_num
      FROM story_status s
      WHERE s.is_active = true
    `;

    const params = [];
    let paramIndex = 1;

    if (genre) {
      query += ` AND s.genre = $${paramIndex}`;
      params.push(genre);
      paramIndex++;
    }

    if (search) {
      query += ` AND (s.title ILIKE $${paramIndex} OR s.style ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // 获取总数
    let countQuery = `SELECT COUNT(*) FROM story_status s WHERE s.is_active = true`;
    const countParams = [];
    let countParamIndex = 1;

    if (genre) {
      countQuery += ` AND s.genre = $${countParamIndex}`;
      countParams.push(genre);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (s.title ILIKE $${countParamIndex} OR s.style ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      stories: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// 获取单个小说详情
app.get('/api/stories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id);

    // 首先尝试通过 id 查找
    let result = await pool.query(`
      SELECT
        s.id,
        s.story_id,
        s.title,
        s.genre,
        s.style,
        s.target_word_count,
        s.current_word_count,
        s.current_chapter,
        s.current_volume,
        s.current_stage,
        s.current_realm,
        s.is_active,
        s.created_at
      FROM story_status s
      WHERE s.id = $1
      LIMIT 1
    `, [idNum]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const story = result.rows[0];

    // story_id 可能是整数或字符串，需要转换为字符串
    const storyIdStr = String(story.story_id || story.id);

    // 获取章节数
    const chapterCountResult = await pool.query(`
      SELECT COUNT(*) FROM chapters WHERE story_id = $1
    `, [storyIdStr]);

    story.chapter_count = parseInt(chapterCountResult.rows[0].count);

    // 获取最新章节
    const latestChapter = await pool.query(`
      SELECT id, chapter_number, title, word_count, created_at
      FROM chapters
      WHERE story_id = $1
      ORDER BY chapter_number DESC
      LIMIT 1
    `, [storyIdStr]);

    if (latestChapter.rows.length > 0) {
      story.latest_chapter = latestChapter.rows[0];
    }

    // 获取世界设定
    const worldSettings = await pool.query(`
      SELECT * FROM world_settings WHERE story_id = $1
    `, [storyIdStr]);

    if (worldSettings.rows.length > 0) {
      story.world_settings = worldSettings.rows[0];
    }

    res.json(story);
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({ error: 'Failed to fetch story' });
  }
});

// 获取小说章节列表
app.get('/api/stories/:id/chapters', async (req, res) => {
  try {
    const { id } = req.params;

    // 先通过 story_status 表获取真实的 story_id
    const storyResult = await pool.query(`
      SELECT story_id FROM story_status WHERE id = $1 LIMIT 1
    `, [id]);

    if (storyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const storyId = storyResult.rows[0].story_id;

    // 查询章节
    const result = await pool.query(`
      SELECT id, chapter_number, title, word_count, created_at
      FROM chapters
      WHERE story_id = $1
      ORDER BY chapter_number ASC
    `, [storyId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

// 获取章节内容
app.get('/api/chapters/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        c.*,
        s.title as story_title,
        s.genre
      FROM chapters c
      JOIN story_status s ON s.story_id = c.story_id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching chapter:', error);
    res.status(500).json({ error: 'Failed to fetch chapter' });
  }
});

// 获取上一章/下一章
app.get('/api/chapters/:id/adjacent', async (req, res) => {
  try {
    const { id } = req.params;

    // 获取当前章节信息
    const currentResult = await pool.query(`
      SELECT story_id, chapter_number FROM chapters WHERE id = $1
    `, [id]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    const { story_id, chapter_number } = currentResult.rows[0];

    // 获取上一章
    const prevResult = await pool.query(`
      SELECT id, chapter_number, title
      FROM chapters
      WHERE story_id = $1 AND chapter_number < $2
      ORDER BY chapter_number DESC
      LIMIT 1
    `, [story_id, chapter_number]);

    // 获取下一章
    const nextResult = await pool.query(`
      SELECT id, chapter_number, title
      FROM chapters
      WHERE story_id = $1 AND chapter_number > $2
      ORDER BY chapter_number ASC
      LIMIT 1
    `, [story_id, chapter_number]);

    res.json({
      prev: prevResult.rows[0] || null,
      next: nextResult.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching adjacent chapters:', error);
    res.status(500).json({ error: 'Failed to fetch adjacent chapters' });
  }
});

// Debug endpoint to check chapters table
app.get('/api/debug/chapters-table', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'chapters'
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to get chapters data
app.get('/api/debug/chapters', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM chapters LIMIT 5`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to get story_status table schema
app.get('/api/debug/story-status-schema', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'story_status'
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
