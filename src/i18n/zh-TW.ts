import type { Messages } from "./types";

export const zhTW: Messages = {
  landing: {
    title: "台灣人徽章",
    intro:
      "運用自然人憑證證明你是年滿 18 歲的台灣人，但不需交出含有個資的完整自然人憑證。",
    start: "開始",
    privacyTrigger: "它如何運作",
    networkUsage:
      "首次使用會下載約 100 MB 的公開驗證元件，之後的驗證會直接使用快取，不需要再下載。",
    interruptedNotice:
      "上一次驗證中斷了，請在繼續驗證時保持此分頁開啟。",
    privacy: {
      result: {
        title: "只給最必要的結果",
        body: "測試驗證端只會知道「已驗證的成年台灣人」，僅此而已。",
      },
      card: {
        title: "完整憑證不會外流",
        body: "卡片始終留在你手中，證明是在你的裝置上產生的。",
      },
      zk: {
        title: "零知識證明",
        body: "用數學確認事實，不揭露背後的資料。",
        learnMore: "深入了解 →",
      },
    },
  },
  setup: {
    title: "驗證前準備",
    introIcCard: "正在準備 4 項裝置上的資源，請稍候。",
    runtime: {
      title: "驗證元件",
      preparing: "驗證元件準備中…",
      ready: "驗證元件已準備完成。",
      components: {
        certChainRS2048: "憑證鏈（RSA-2048）",
        certChainRS4096: "憑證鏈（RSA-4096）",
        userSigRS2048: "使用者簽章",
      },
      retry: "重試",
      reset: "重置快取",
      slowHint: "首次載入需要一點時間。請保持此分頁開啟，勿重新整理。",
    },
    reader: {
      title: "憑證相關元件",
      bodyClickToDetect:
        "點選偵測按鈕，依序檢查 HiPKI LocalSignServer、讀卡機，以及自然人憑證。",
      detect: "偵測",
      reDetect: "重新偵測",
      tryAgain: "重新嘗試",
      readCard: "讀取自然人憑證",
      detecting: "正在檢查 HiPKI LocalSignServer、讀卡機與已插入的憑證…",
      popupBriefly: "系統將自動開啟一個小視窗，請不要關閉此頁面。",
      installPlugin: "安裝自然人憑證跨平台元件",
      noReadersHint: "請插入 USB 讀卡機後，點選重新偵測。",
      insertCard: "請將自然人憑證插入讀卡機後，點選重新偵測。",
      readersWithCards: "請於下方選擇讀卡機，並點選讀取自然人憑證。",
      reading: "正在從 {slot} 讀取自然人憑證…",
      cardReady: "自然人憑證 {sn}",
      cardReadyWithDn: "自然人憑證 {sn}（{dn}）",
      readerUnnamed: "（未命名讀卡機）",
      readerCardLabel: "自然人憑證 {sn}",
      readerNoCard: "尚未插入自然人憑證",
      steps: {
        server: "HiPKI LocalSignServer",
        serverReadyWithVersion: "HiPKI LocalSignServer（v{version}）",
        reader: "讀卡機",
        readerReady: "讀卡機（已偵測到 {count} 個）",
        card: "自然人憑證",
        cardReady: "自然人憑證（已插入 {count} 張）",
      },
    },
    smt: {
      title: "憑證狀態",
      bodyReadCardFirst: "請先讀取自然人憑證。",
      bodyLoading: "正在於本機檢查自然人憑證狀態…",
      retry: "重試",
      reset: "重置快取",
      ready: "憑證狀態已確認（CRL #{crlNumber}，發行單位 {issuer}）。",
      phases: {
        wasm: "載入憑證狀態檢查元件",
        snapshot: "下載憑證狀態快照",
        ingest: "準備憑證狀態檢查",
      },
      progressBytes: " — {done} / {total}",
      progressNodes: " — {done} / {total} 筆",
      progressBytesOnly: " — {done}",
    },
    pin: {
      title: "PIN 驗證",
      warning:
        "PIN 共有 3 次機會，第 4 次錯誤將鎖卡，需至內政部憑證管理中心解鎖。",
      warningLinkLabel: "解鎖說明 →",
      bodyDetectFirst: "請先讀取自然人憑證。",
      bodyEnter: "輸入 PIN 後按驗證。",
      verifying: "正在透過本機讀卡視窗驗證 PIN…",
      verifyButton: "驗證 PIN",
      lockedSession: "PIN 已驗證，本次流程不需再輸入。",
      lockedBadge: "本次已通過 PIN",
      cardLockedHardware: "卡片已鎖定。請至內政部憑證管理中心解鎖。",
      attemptsLeftOne: "PIN 不正確。最後一次機會，再錯就會鎖卡。",
      attemptsLeftMany: "PIN 不正確。還有 {remaining} 次機會。",
      placeholder: "PIN",
    },
    technical: {
      runtimeKind: "驗證元件",
      crlNumber: "憑證狀態（CRL 編號）",
      issuer: "發行單位",
      serverVersion: "讀卡機軟體版本",
      subjectDn: "憑證主體",
    },
    back: "返回",
    continue: "繼續",
  },
  ready: {
    title: "確認證明內容",
    intro:
      "已準備好證明你的台灣人徽章資格。測試驗證端僅會收到確認資格所需的資訊，不會收到含有您個資的自然人憑證資料。",
    groups: {
      claim: "測試驗證端將得知的內容",
      inputs: "來自你卡片的資料（不會傳送）",
    },
    rows: {
      card: "自然人憑證",
      certChain: "資格條件",
      runtime: "憑證狀態",
      pin: "PIN",
      challenge: "驗證請求",
    },
    helpers: {
      card: "用於簽署證明。",
      certChain: "本次證明測試驗證端只會得知這件事。",
      runtime: "在本機檢查最新快照。",
      pin: "在本機解鎖卡片，不會傳送。",
      challenge: "測試驗證端的一次性請求，防止重複使用。",
    },
    cardNotReady: "尚未準備",
    cardEmpty: "—",
    chainRsa4096: "年滿 18 歲的台灣人",
    chainRsa2048: "年滿 18 歲的台灣人",
    runtimeReady: "已在本機確認有效",
    runtimeStatus: "狀態：{status}",
    pinLocked: "已驗證",
    pinStatus: "狀態：{status}",
    challengeShort: "{short}…",
    challengeFetching: "正在取得驗證請求…",
    backToSetup: "返回",
    startProving: "開始證明",
    startProvingFetching: "取得驗證請求中…",
    startProvingRetry: "重試",
  },
  proving: {
    title: "正在證明你的資格",
    intro:
      "你的瀏覽器正在產生證明，可能需要幾秒鐘。請保持此分頁開啟。",
    cancel: "取消",
    runningLabel: "證明中…",
    errorLabel: "錯誤",
    steps: {
      challenge: "取得驗證請求",
      sign: "確認自然人憑證",
      smt: "檢查憑證是否有效（是否於廢止清冊）",
      build: "準備證明資料",
      prove_cert: "確認徽章資格",
      prove_user_sig: "完成證明",
    },
    sublabels: {
      witness: "準備中",
      prep: "準備中",
      proving: "證明中",
    },
    progress: {
      summary: "第 {current} / {total} 步",
      showSteps: "顯示所有步驟",
      hideSteps: "收合步驟",
      segmentsLabel: "證明進度，第 {current} / {total} 步",
      statusIdle: "準備開始",
      statusDone: "即將完成",
    },
  },
  review: {
    title: "確認後送出",
    intro:
      "證明已在裝置上準備完成，尚未送出。確認後，測試驗證端會收到完成驗證所需的資訊，並更新你的徽章狀態。",
    technical: {
      challenge: "驗證請求 ID",
      certChainType: "憑證類型",
      certProofBytes: "資格證明大小",
      userSigProofBytes: "使用者簽章證明大小",
      provingMs: "證明時間",
    },
    privacy: {
      willSendLabel: "將送出給測試驗證端",
      willSendValue: "必要證明資訊",
      willSendHelper:
        "包含本次驗證請求、防止重複驗證所需資訊，以及確認憑證有效所需資訊。",
      willNotSendLabel: "不會送出給測試驗證端",
      willNotSendValue: "含有您個資的自然人憑證資料、PIN 碼。",
    },
    guardrail:
      "證明接近 2 MB 上傳限制，送出可能失敗。若失敗請重試。",
    retry: "重新證明",
    send: "送出證明",
  },
  submitting: {
    title: "正在送出證明",
    intro:
      "請保持此分頁開啟。測試驗證端正在驗證你的證明。",
    submitStep: "送出給測試驗證端",
  },
  result: {
    headlines: {
      verified: "已驗證",
      rejected: "未通過",
      error: "無法完成驗證",
    },
    detailVerified:
      "驗證共耗時 {total}。回到測試驗證端，您的個人檔案會顯示台灣人徽章。",
    detailRejected:
      "測試驗證端未通過你的證明（回應時間 {submitMs}）。請重新證明。",
    reasons: {
      proof_invalid: "你的證明未通過驗證。請重新證明。",
      smt_root_mismatch:
        "憑證狀態快照已更新。請點「重新整理並再試一次」取得最新資料。",
      issuer_modulus_mismatch:
        "你卡片的發行單位與測試驗證端信任的不一致。請確認使用的是自然人憑證。",
      app_id_mismatch:
        "App ID 不一致。請回到測試驗證端，重新開始驗證流程。",
      challenge_mismatch:
        "驗證請求不一致。請回到測試驗證端，重新開始驗證流程。",
    },
    clearing: "清除中…",
    backToForum: "回到測試驗證端",
    proveAgain: "重新證明",
    refreshRetry: "重新整理並再試一次",
    clearCheckbox: "離開前同時清除快取資料（{size}）",
    clearCheckboxNoSize: "離開前同時清除快取資料",
    clearWhyTitle: "什麼時候要清除？",
    clearWhyBody:
      "這些是公開的驗證檔案（證明金鑰、憑證狀態快照），暫存於裝置上以加快下次證明，其中不含任何個人資料。日後重新下載所需的網路流量遠小於這個容量。若不需要在此裝置再次證明，可清除以釋放空間。",
    technical: {
      nullifier: "nullifier",
      pkCommit: "pkCommit",
      smtRoot: "smt_root",
      challenge: "challenge",
      issuerRsaModulus: "issuerRsaModulus",
    },
  },
  technical: {
    sectionTitle: "技術資訊",
    explanation:
      "這些技術資訊是證明本身的一部分，也方便排查問題，測試驗證端不會收到含有您個資的自然人憑證資料或 PIN 碼。",
    copyAll: "全部複製",
    copied: "已複製！",
  },
  errors: {
    technicalLabel: "技術細節",
    technicalExplanation: "提供給支援人員的診斷資訊，不含任何個人資料。",
    network_offline: {
      headline: "無法連線",
      body: "你的裝置目前似乎沒有網路。請確認網路連線後再試一次。",
    },
    network_http: {
      headline: "服務暫時無法使用",
      body: "驗證服務目前暫時無法使用。請稍後再試一次。",
    },
    verifier_unavailable: {
      headline: "無法連線到驗證服務",
      body: "目前無法取得測試驗證端驗證服務的回應。請重試，或稍後再回來嘗試。",
    },
    verifier_provider_unavailable: {
      headline: "驗證服務的資料來源暫時無法使用",
      body: "測試驗證端驗證服務目前無法存取所需的資料來源。請稍候片刻後再試一次。",
    },
    challenge_expired: {
      headline: "驗證請求已過期",
      body: "測試驗證端發出的驗證請求已逾時。請點選重新證明以取得新的請求。",
    },
    challenge_consumed: {
      headline: "此驗證請求已被使用",
      body: "此驗證請求已經被使用過。請點選重新證明以取得新的請求。",
    },
    nullifier_duplicate: {
      headline: "此自然人憑證已驗證過",
      body: "這張自然人憑證已經為測試驗證端完成過驗證。每張卡片僅能驗證一次。",
    },
    popup_blocked: {
      headline: "讀卡視窗被瀏覽器封鎖",
      body: "瀏覽器封鎖了讀卡機跳出視窗。請允許此網站開啟跳出視窗，然後再次點選偵測。",
    },
    popup_timeout: {
      headline: "讀卡機沒有回應",
      body: "讀卡機軟體未在時限內回應。請確認軟體正在執行，然後再次點選偵測。",
    },
    hipki_not_installed: {
      headline: "尚未啟動 HiPKI LocalSignServer",
      body: "請啟動本機的 HiPKI LocalSignServer，然後點選重新嘗試。若尚未安裝，請安裝自然人憑證跨平台元件。",
    },
    card_reader_unreachable: {
      headline: "找不到讀卡機軟體",
      body: "無法連線到本機讀卡機軟體。請在這台電腦安裝並保持運作，然後再次點選偵測。",
    },
    card_sign_failed: {
      headline: "自然人憑證簽署失敗",
      body: "讀卡機回報異常。請重新插入自然人憑證後再試一次。",
    },
    asset_corrupt: {
      headline: "本機快取檔案異常或已過期",
      body: "本機的驗證檔案未通過完整性檢查。按下「重置快取」會清除快取並重新整理頁面。",
    },
    asset_unreachable: {
      headline: "無法下載驗證檔案",
      body: "無法下載驗證檔案。請確認網路連線後再試一次。",
    },
    storage_full: {
      headline: "裝置儲存空間不足",
      body: "驗證元件無法寫入裝置。請釋出空間後再試，或改用桌面瀏覽器進行首次驗證。",
    },
    rate_limited: {
      headline: "下載次數過多",
      body: "下載伺服器暫時限制了存取頻率。請稍候幾分鐘後再試一次。",
    },
    wasm_init: {
      headline: "無法啟動本機證明引擎",
      body: "瀏覽器無法啟動本機證明引擎。請重新整理此分頁，或改用其他瀏覽器。",
    },
    unknown: {
      headline: "發生未預期的錯誤",
      body: "目前發生未預期的問題。請重試，若問題持續，請展開技術細節並提供給支援人員。",
    },
  },
  carousel: {
    ariaLabel: "零知識隱私說明",
    pause: "暫停",
    resume: "繼續",
    prev: "上一張",
    next: "下一張",
    proving: {
      card1: {
        headline: "卡片留在你手裡",
        body: "卡片從未離開你身邊。此刻只是在產生一段數學證明。",
      },
      card2: {
        headline: "是數學，不是資料",
        body: "你的瀏覽器正在建構零知識證明：以數學確認事實，但不揭露背後的資料。",
      },
      card3: {
        headline: "全部都在本機",
        body: "這項計算只在你的裝置上進行。目前還沒有任何資料被送出。",
      },
      card4: {
        headline: "即將完成",
        body: "證明完成後，只有「證明本身」會被送出，你的資料永遠不會。",
      },
    },
    submitting: {
      card1: {
        headline: "只給答案",
        body: "測試驗證端只會知道「是已驗證的成年台灣人」。不會看到你的姓名、身分證字號或 PIN。",
      },
      card2: {
        headline: "數學正在被驗證",
        body: "測試驗證端正在做一次快速的數學檢查。整個過程不涉及任何個人資料。",
      },
      card3: {
        headline: "不留下足跡",
        body: "這份證明只能用於本次驗證，無法被反推或再次連結到你。",
      },
      card4: {
        headline: "開源、可驗證",
        body: "整個協議在 GitHub 上公開。任何人，包含你自己，都能檢驗隱私保護是否成立。",
        link: "在 GitHub 上查看",
      },
    },
  },
  switcher: {
    en: "EN",
    zhTw: "中文",
    ariaLabel: "語言",
  },
};
