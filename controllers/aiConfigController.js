const AIConfig = require('../models/AIConfig');

class AIConfigController {
  getAIConfigs(req, res) {
    AIConfig.getAll((err, configs) => {
      if (err) {
        req.flash('error_msg', 'Lỗi khi tải danh sách cấu hình AI');
        return res.redirect('/dashboard');
      }
      
      res.render('ai-configs/index', {
        configs,
        title: 'Quản lý cấu hình AI'
      });
    });
  }

  getCreateAIConfig(req, res) {
    res.render('ai-configs/create', {
      title: 'Thêm cấu hình AI mới'
    });
  }

  postCreateAIConfig(req, res) {
    const { 
      name, description, prompt_template, tone, language,
      temperature, top_p, top_k, max_output_tokens 
    } = req.body;
    
    const newConfig = {
      name,
      description,
      prompt_template,
      ai_model: process.env.DEFAULT_AI_MODEL || 'gemini-2.0-flash',
      tone,
      language,
      temperature,
      top_p,
      top_k,
      max_output_tokens
    };
    
    AIConfig.create(newConfig, (err) => {
      if (err) {
        req.flash('error_msg', 'Lỗi khi tạo cấu hình AI mới');
        return res.redirect('/ai-configs/create');
      }
      
      req.flash('success_msg', 'Đã thêm cấu hình AI mới thành công');
      res.redirect('/ai-configs');
    });
  }

  getEditAIConfig(req, res) {
    AIConfig.getById(req.params.id, (err, config) => {
      if (err || !config) {
        req.flash('error_msg', 'Không tìm thấy cấu hình AI');
        return res.redirect('/ai-configs');
      }
      
      res.render('ai-configs/edit', {
        config,
        title: 'Chỉnh sửa cấu hình AI'
      });
    });
  }

  postUpdateAIConfig(req, res) {
    const { 
      name, description, prompt_template, tone, language,
      temperature, top_p, top_k, max_output_tokens 
    } = req.body;
    
    const updatedConfig = {
      name,
      description,
      prompt_template,
      ai_model: process.env.DEFAULT_AI_MODEL || 'gemini-2.0-flash',
      tone,
      language,
      temperature,
      top_p,
      top_k,
      max_output_tokens
    };
    
    AIConfig.update(req.params.id, updatedConfig, (err) => {
      if (err) {
        req.flash('error_msg', 'Lỗi khi cập nhật cấu hình AI');
        return res.redirect(`/ai-configs/edit/${req.params.id}`);
      }
      
      req.flash('success_msg', 'Đã cập nhật cấu hình AI thành công');
      res.redirect('/ai-configs');
    });
  }

  deleteAIConfig(req, res) {
    AIConfig.delete(req.params.id, (err) => {
      if (err) {
        req.flash('error_msg', 'Lỗi khi xóa cấu hình AI');
      } else {
        req.flash('success_msg', 'Đã xóa cấu hình AI thành công');
      }
      
      res.redirect('/ai-configs');
    });
  }
}

module.exports = new AIConfigController(); 