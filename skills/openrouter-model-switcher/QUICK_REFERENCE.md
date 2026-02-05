# OpenRouter Model Switcher - Quick Reference

## 🚀 Quick Commands

### Switch Model
```bash
# Set model (with openrouter/ prefix)
railway variables --set "MODEL_NAME=openrouter/xiaomi/mimo-v2-flash"
railway variables --set "MODEL_ID=openrouter/xiaomi/mimo-v2-flash"

# Redeploy
railway up
```

### Check Current Model
```bash
# View environment variables
railway variables | Select-String "MODEL"

# Check logs
railway logs --follow | Select-String "agent model"
```

### Validate Configuration
```bash
# Run validator script (inside container)
railway run "python /app/skills/openrouter-model-switcher/scripts/validate_model_switch.py"
```

## 📝 Model Format Cheat Sheet

| Model | Format |
|-------|--------|
| Xiaomi MiMo V2 Flash | `openrouter/xiaomi/mimo-v2-flash` |
| StepFun Step 3.5 Flash | `openrouter/stepfun/step-3.5-flash:free` |
| Meta Llama 3.3 70B | `openrouter/meta-llama/llama-3.3-70b:free` |

**Rule**: Always include `openrouter/` prefix!

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Unknown model" error | Check model format includes `openrouter/` |
| Model not switching | Verify env vars, force rebuild: `FORCE_REBUILD=1 railway up` |
| API errors | Ensure `OPENROUTER_API_KEY` is set correctly |

## ✅ Pre-Deployment Checklist

- [ ] `OPENROUTER_API_KEY` is set
- [ ] `MODEL_NAME` includes `openrouter/` prefix
- [ ] `MODEL_ID` matches `MODEL_NAME`
- [ ] Model ID is valid OpenRouter model
- [ ] Run validator: `python validate_model_switch.py`

## 📚 Full Documentation

See `SKILL.md` for comprehensive guide, technical details, and advanced usage.
