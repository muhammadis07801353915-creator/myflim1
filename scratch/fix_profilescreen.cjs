const fs = require('fs');
const path = 'c:/Users/muham/OneDrive/Documents/myfilm (1)/myflim-expo/src/screens/ProfileScreen.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
console.log('Total lines before fix:', lines.length);

// Corrupted section: lines 1295-1462 (1-indexed) = indices 1294-1461 (0-indexed)
// The correct content for this range:
const correctSection = `              {/* 3. Arabic */}
              <TouchableOpacity
                style={[
                  styles.langCardItem,
                  { backgroundColor: language === 'ar' ? (theme === 'light' ? '#FFF5F5' : 'rgba(204,34,47,0.14)') : themeColors.surfaceLight },
                  language === 'ar' ? { borderColor: '#CC222F', borderWidth: 1.5 } : { borderColor: themeColors.border, borderWidth: 1 },
                  isRTL && { flexDirection: 'row-reverse' }
                ]}
                onPress={() => {
                  setLanguage('ar');
                  setShowLangModal(false);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.langRadioCircle, language === 'ar' ? { backgroundColor: '#CC222F' } : { backgroundColor: theme === 'light' ? '#E5E7EB' : 'rgba(255,255,255,0.1)' }]}>
                  {language === 'ar' && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={[styles.langCardLabel, { color: language === 'ar' ? '#CC222F' : themeColors.text }, isRTL && { textAlign: 'right' }]}>
                  العربية
                </Text>
                <View style={styles.langFlagBadge}>
                  <Text style={styles.langFlagEmoji}>🇮🇶</Text>
                </View>
              </TouchableOpacity>

              {/* 4. English */}
              <TouchableOpacity
                style={[
                  styles.langCardItem,
                  { backgroundColor: language === 'en' ? (theme === 'light' ? '#FFF5F5' : 'rgba(204,34,47,0.14)') : themeColors.surfaceLight },
                  language === 'en' ? { borderColor: '#CC222F', borderWidth: 1.5 } : { borderColor: themeColors.border, borderWidth: 1 },
                  isRTL && { flexDirection: 'row-reverse' }
                ]}
                onPress={() => {
                  setLanguage('en');
                  setShowLangModal(false);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.langRadioCircle, language === 'en' ? { backgroundColor: '#CC222F' } : { backgroundColor: theme === 'light' ? '#E5E7EB' : 'rgba(255,255,255,0.1)' }]}>
                  {language === 'en' && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={[styles.langCardLabel, { color: language === 'en' ? '#CC222F' : themeColors.text }, isRTL && { textAlign: 'right' }]}>
                  English
                </Text>
                <View style={styles.langFlagBadge}>
                  <Text style={styles.langFlagEmoji}>🇬🇧</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>`;

// Take everything before line 1295 (index 1294) and after line 1462 (index 1461 inclusive)
const before = lines.slice(0, 1294).join('\n');
const after = lines.slice(1462).join('\n');

const newContent = before + '\n' + correctSection + '\n' + after;
fs.writeFileSync(path, newContent, 'utf8');
console.log('Fixed! Total lines after:', newContent.split('\n').length);
