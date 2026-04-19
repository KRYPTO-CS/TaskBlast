$replacements = @(
  @{ Path = 'C:\Users\JankJ\Documents\GitHub\KRYPTO4901\TaskBlast\app\pages\ForgotPassword.tsx'; Pattern = '(?s)<Text\s+className="font-madimi text-sm text-white drop-shadow-md cursor-pointer"\s+onPress=\{onBack\}>\s*\{t\("language.backTo"\)\}\s*<Text className="font-semibold text-yellow-300">\s*\{\" \"\}\{t\("language.Login"\)\}\s*</Text>\s*</Text>'; Replacement = @'
            <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
              <Text className="font-madimi text-sm text-white drop-shadow-md">
                {t("language.backTo")}
                <Text className="font-semibold text-yellow-300">
                  {" "}{t("language.Login")}
                </Text>
              </Text>
            </TouchableOpacity>
'@ },
  @{ Path = 'C:\Users\JankJ\Documents\GitHub\KRYPTO4901\TaskBlast\app\pages\ResetPassword.tsx'; Pattern = '(?s)<Text\s+className="font-madimi text-sm text-white drop-shadow-md cursor-pointer"\s+onPress=\{onBack\}>\s*\{t\("language.backTo"\)\}\s*<Text className="font-semibold text-yellow-300">\s*\{\" \"\}\{t\("language.Login"\)\}\s*</Text>\s*</Text>'; Replacement = @'
            <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
              <Text className="font-madimi text-sm text-white drop-shadow-md">
                {t("language.backTo")}
                <Text className="font-semibold text-yellow-300">
                  {" "}{t("language.Login")}
                </Text>
              </Text>
            </TouchableOpacity>
'@ },
  @{ Path = 'C:\Users\JankJ\Documents\GitHub\KRYPTO4901\TaskBlast\app\pages\SignUpEmail.tsx'; Pattern = '(?s)<Text\s+className="font-madimi text-sm text-white drop-shadow-md cursor-pointer"\s+onPress=\{onBack\}>\s*\{t\("language.backTo"\)\}\s*<Text className="font-semibold text-yellow-300">\s*\{\" \"\}\{t\("birthdate.previousStep"\)\}\s*</Text>\s*</Text>'; Replacement = @'
            <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
              <Text className="font-madimi text-sm text-white drop-shadow-md">
                {t("language.backTo")}
                <Text className="font-semibold text-yellow-300">
                  {" "}{t("birthdate.previousStep")}
                </Text>
              </Text>
            </TouchableOpacity>
'@ },
  @{ Path = 'C:\Users\JankJ\Documents\GitHub\KRYPTO4901\TaskBlast\app\pages\SignUpManagerPin.tsx'; Pattern = '(?s)<Text\s+className="font-madimi text-sm text-white drop-shadow-md cursor-pointer"\s+onPress=\{onBack\}>\s*\{t\("language.backTo"\)\}\s*\{" "\}\s*<Text className="font-semibold text-yellow-300">\s*\{t\("accountType.title"\)\}\s*</Text>\s*</Text>'; Replacement = @'
              <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
                <Text className="font-madimi text-sm text-white drop-shadow-md">
                  {t("language.backTo")} {" "}
                  <Text className="font-semibold text-yellow-300">
                    {t("accountType.title")}
                  </Text>
                </Text>
              </TouchableOpacity>
'@ },
  @{ Path = 'C:\Users\JankJ\Documents\GitHub\KRYPTO4901\TaskBlast\app\pages\SignUpBirthdate.tsx'; Pattern = '(?s)<Text\s+className="font-madimi text-sm text-white drop-shadow-md cursor-pointer"\s+onPress=\{onBack\}>\s*\{t\("language.backTo"\)\}\s*<Text className="font-semibold text-yellow-300">\s*\{\" \"\}\{t\("birthdate.previousStep"\)\}\s*</Text>\s*</Text>'; Replacement = @'
            <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
              <Text className="font-madimi text-sm text-white drop-shadow-md">
                {t("language.backTo")}
                <Text className="font-semibold text-yellow-300">
                  {" "}{t("birthdate.previousStep")}
                </Text>
              </Text>
            </TouchableOpacity>
'@ },
  @{ Path = 'C:\Users\JankJ\Documents\GitHub\KRYPTO4901\TaskBlast\app\pages\SignUpAccountType.tsx'; Pattern = '(?s)<Text\s+className="font-madimi text-sm text-white drop-shadow-md cursor-pointer"\s+onPress=\{onBack\}>\s*\{t\("language.backTo"\)\}\s*<Text className="font-semibold text-yellow-300">\s*\{\" \"\}\{t\("birthdate.previousStep"\)\}\s*</Text>\s*</Text>'; Replacement = @'
            <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
              <Text className="font-madimi text-sm text-white drop-shadow-md">
                {t("language.backTo")}
                <Text className="font-semibold text-yellow-300">
                  {" "}{t("birthdate.previousStep")}
                </Text>
              </Text>
            </TouchableOpacity>
'@ },
  @{ Path = 'C:\Users\JankJ\Documents\GitHub\KRYPTO4901\TaskBlast\app\pages\SignUpLanguage.tsx'; Pattern = '(?s)<Text\s+className="font-madimi text-sm text-white drop-shadow-md cursor-pointer"\s+onPress=\{onBack\}>\s*\{t\("language.backTo"\)\}\s*<Text className="font-semibold text-yellow-300">\s*\{\" \"\}\s*\{t\("language.Login"\)\}\s*</Text>\s*</Text>'; Replacement = @'
            <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
              <Text className="font-madimi text-sm text-white drop-shadow-md">
                {t("language.backTo")}
                <Text className="font-semibold text-yellow-300">
                  {" "}
                  {t("language.Login")}
                </Text>
              </Text>
            </TouchableOpacity>
'@ },
  @{ Path = 'C:\Users\JankJ\Documents\GitHub\KRYPTO4901\TaskBlast\app\pages\VerifyCode.tsx'; Pattern = '(?s)<Text\s+className="font-madimi text-sm text-white drop-shadow-md cursor-pointer"\s+onPress=\{onBack\}>\s*\{t\("language.backTo"\)\}\s*<Text className="font-semibold text-yellow-300">\s*\{\" \"\}\{t\("language.Login"\)\}\s*</Text>\s*</Text>'; Replacement = @'
            <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
              <Text className="font-madimi text-sm text-white drop-shadow-md">
                {t("language.backTo")}
                <Text className="font-semibold text-yellow-300">
                  {" "}{t("language.Login")}
                </Text>
              </Text>
            </TouchableOpacity>
'@ },
  @{ Path = 'C:\Users\JankJ\Documents\GitHub\KRYPTO4901\TaskBlast\app\pages\SignUpCreatePassword.tsx'; Pattern = '(?s)<Text\s+className="font-madimi text-sm text-white drop-shadow-md cursor-pointer"\s+onPress=\{onBack\}>\s*\{t\("language.backTo"\)\}\s*<Text className="font-semibold text-yellow-300">\s*\{\" \"\}\{t\("birthdate.previousStep"\)\}\s*</Text>\s*</Text>'; Replacement = @'
            <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
              <Text className="font-madimi text-sm text-white drop-shadow-md">
                {t("language.backTo")}
                <Text className="font-semibold text-yellow-300">
                  {" "}{t("birthdate.previousStep")}
                </Text>
              </Text>
            </TouchableOpacity>
'@ }
)
foreach ($r in $replacements) {
  $content = Get-Content -Raw $r.Path
  $updated = [regex]::Replace($content, $r.Pattern, $r.Replacement)
  if ($updated -ne $content) { Set-Content -Path $r.Path -Value $updated -NoNewline }
}
Write-Host 'updated'