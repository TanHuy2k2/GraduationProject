import gspread
from oauth2client.service_account import ServiceAccountCredentials

# Cấu hình xác thực
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_name("../backend/weights/googleAPI.json", scope)
client = gspread.authorize(creds)

# Mở Google Sheet
spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1cTJM1fDZXKyXAZQnxfP4cqkiDSahG8_6EaIxZ5E6mbU/edit?usp=sharing'  # Thay bằng link Google Sheets của bạn
spreadsheet = client.open_by_url(spreadsheet_url)
sheet1 = spreadsheet.get_worksheet(0)  # Mở sheet đầu tiên
sheet2 = spreadsheet.get_worksheet(1)
sheet3 = spreadsheet.get_worksheet(2)

# Hàm tìm dữ liệu trong bảng dựa trên gender, age, BMI, fitness level
def get_sheet1_info(gender, age, bmi, fitness_level):
    # Lấy toàn bộ dữ liệu từ Google Sheet
    data = sheet1.get_all_records()

    # Duyệt qua từng hàng để tìm hàng phù hợp với các điều kiện
    for row in data:
        if (row["Gender"] == gender and
            row["Age"] == age and
            row["BMI"] == bmi and
            row["Fitness Level"] == fitness_level):
            # Trả về các giá trị Rest, Sets, Reps
            return {
                "db_weights": row["Weight(kg)"],
                "rest": row["Rest (sec)"],
                "sets": row["Sets"],
                "reps": row["Reps"]
            }
    return "No data available for the given inputs."

def get_sheet2_info(gender, age, fitness_level):
    # Lấy toàn bộ dữ liệu từ Google Sheet
    data = sheet2.get_all_records()

    # Duyệt qua từng hàng để tìm hàng phù hợp với các điều kiện
    for row in data:
        if (row["Gender"] == gender and
            row["Age"] == age and
            row["Fitness Level"] == fitness_level):
            # Trả về các giá trị Rest, Sets, Reps
            return {
                "rest": row["Rest (sec)"],
                "sets": row["Sets"],
                "reps": row["Reps"]
            }
    return "No data available for the given inputs."

def get_sheet3_info(gender, age, bmi, fitness_level):
    # Lấy toàn bộ dữ liệu từ Google Sheet
    data = sheet3.get_all_records()

    # Duyệt qua từng hàng để tìm hàng phù hợp với các điều kiện
    for row in data:
        if (row["Gender"] == gender and
            row["Age"] == age and
            row["BMI"] == bmi and
            row["Fitness Level"] == fitness_level):
            # Trả về các giá trị Rest, Sets, Reps
            return {
                "rest": row["Rest (sec)"],
                "sets": row["Sets"],
                "reps": row["Reps"]
            }
    return "No data available for the given inputs."